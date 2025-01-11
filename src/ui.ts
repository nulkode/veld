import * as THREE from "three";
import { TransformControls } from "three/addons/controls/TransformControls.js";
import {
  camera,
  renderer,
  sandbox,
  rotateCameraToPosition,
  transformControls,
  orbitControls,
} from "./renderer";
import {
  Sandbox,
  SandboxStatus,
  PhysicalEntity,
  protonModel,
  electronModel,
  Charge,
  Field,
  MagneticField,
  ElectricField,
} from "./sandbox";

export class Panel {
  id: string;
  title: string;
  fields: PanelField[];
  minimized: boolean;

  constructor(id: string, title: string, fields: PanelField[]) {
    this.id = id;
    this.title = title;
    this.fields = fields;
    this.minimized = false;
  }

  toggleMinimize() {
    this.minimized = !this.minimized;
    const panelContent = document.getElementById(`${this.id}-content`);
    if (panelContent) {
      panelContent.style.display = this.minimized ? "none" : "block";
    }
  }

  getHTML() {
    const fieldsHTML = this.fields.map((field) => field.getHTML()).join("");
    return `
      <div class="panel ui" id="${this.id}">
        <div class="panel-header" id="${this.id}-header">
          <span>${this.title}</span>
          <button id="${this.id}-toggle">_</button>
        </div>
        <div class="panel-content" id="${this.id}-content">
          ${fieldsHTML}
        </div>
      </div>
    `;
  }

  attachEvents() {
    document
      .getElementById(`${this.id}-toggle`)
      ?.addEventListener("click", () => this.toggleMinimize());
    this.fields.forEach((field) => field.attachEvents());
  }
}

abstract class PanelField {
  id: string;
  label: string;

  constructor(id: string, label: string) {
    this.id = id;
    this.label = label;
  }

  abstract getHTML(): string;
  abstract attachEvents(): void;
}

abstract class ValuePanelField<T> extends PanelField {
  value: T;
  onUpdate?: (value: T) => void;
  labelGenerator?: (value: T) => string;

  constructor(
    id: string,
    label: string,
    value: T,
    onUpdate?: (value: T) => void,
    labelGenerator?: (value: T) => string
  ) {
    super(id, label);
    this.value = value;
    this.labelGenerator = labelGenerator;
    this.onUpdate = onUpdate;
  }

  setValue(value: T) {
    this.value = value;
    const span = document.getElementById(`${this.id}-value`);
    if (span) {
      span.innerHTML = this.getLabel(value);
    }
    const input = document.getElementById(this.id) as HTMLInputElement;
    if (input) {
      input.value =
        typeof value === "string" || typeof value === "number"
          ? value.toString()
          : "";
    }
  }

  getLabel(value: T): string {
    return this.labelGenerator ? this.labelGenerator(value) : `${value}`;
  }

  abstract getHTML(): string;
  abstract attachEvents(): void;
}

export class PanelTextField extends PanelField {
  content: string;

  constructor(id: string, label: string, content: string) {
    super(id, label);
    this.content = content;
  }

  getHTML() {
    return `<div><label>${this.label}</label><p>${this.content}</p></div>`;
  }

  attachEvents() {
    // No events to attach for static text
  }
}

export class PanelValueSliderField extends ValuePanelField<number> {
  min: number;
  max: number;
  onUpdate: (value: number) => void;

  constructor(
    id: string,
    label: string,
    min: number,
    max: number,
    value: number,
    onUpdate: (value: number) => void,
    labelGenerator?: (value: number) => string
  ) {
    super(id, label, value, onUpdate, labelGenerator);
    this.min = min;
    this.max = max;
    this.onUpdate = onUpdate;

    onUpdate(value);
  }

  getHTML() {
    const label = this.getLabel(this.value);
    return `
      <div>
        <label for="${this.id}">${this.label}: <span id="${this.id}-value">${label}</span></label>
        <input type="range" id="${this.id}" min="${this.min}" max="${this.max}" value="${this.value}">
      </div>
    `;
  }

  attachEvents() {
    document.getElementById(this.id)?.addEventListener("input", (event) => {
      const input = event.target as HTMLInputElement;
      const value = parseInt(input.value);
      this.value = value;
      this.onUpdate(value);
      const span = document.getElementById(`${this.id}-value`);
      if (span) {
        span.innerHTML = this.getLabel(value);
      }
    });
  }
}

export class PanelValueToggleField extends ValuePanelField<boolean> {
  constructor(
    id: string,
    label: string,
    value: boolean,
    onUpdate?: (value: boolean) => void,
    labelGenerator?: (value: boolean) => string
  ) {
    super(id, label, value, onUpdate, labelGenerator);
    this.onUpdate = onUpdate;
    if (onUpdate) onUpdate(value);
  }

  getHTML() {
    return `
      <div>
        <label for="${this.id}">${this.label}</label>
        <button id="${this.id}" class="toggle-button ${
      this.value ? "on" : "off"
    }">
          ${this.value ? "On" : "Off"}
        </button>
      </div>
    `;
  }

  attachEvents() {
    document.getElementById(this.id)!.addEventListener("click", () => {
      this.value = !this.value;
      if (this.onUpdate) this.onUpdate(this.value);
      const button = document.getElementById(this.id) as HTMLButtonElement;
      button.classList.toggle("on", this.value);
      button.classList.toggle("off", !this.value);
      button.innerHTML = this.value ? "On" : "Off";
    });
  }
}

export class PanelValueScientificField extends ValuePanelField<number> {
  unit: string;
  onUpdate: (value: number) => void;
  allowZero: boolean;

  constructor(
    id: string,
    label: string,
    unit: string, // Added unit argument
    value: number,
    onUpdate: (value: number) => void,
    labelGenerator?: (value: number) => string,
    allowZero: boolean = true
  ) {
    super(id, label, value, labelGenerator);
    this.unit = unit;
    this.onUpdate = onUpdate;
    this.allowZero = allowZero;
    onUpdate(value);
  }

  getHTML() {
    let [decimal, exponent] = this.value.toExponential().split("e");
    if (parseInt(exponent) === 0) {
      exponent = "0";
    }

    return `
      <div>
        <label for="${this.id}">${this.label} (${this.unit})</label>
        <div class="scientific-input">
          <input type="number" id="${this.id}-decimal" value="${decimal}">
          ×10<sup><input type="number" id="${this.id}-exponent" value="${
      !exponent ? "0" : exponent
    }"></sup>
        </div>
      </div>
    `;
  }

  attachEvents() {
    const decimalInput = document.getElementById(
      `${this.id}-decimal`
    ) as HTMLInputElement;
    const exponentInput = document.getElementById(
      `${this.id}-exponent`
    ) as HTMLInputElement;

    decimalInput?.addEventListener("input", () => this.updateValue());
    exponentInput?.addEventListener("input", () => this.updateValue());
  }

  private updateValue() {
    const decimalInput = document.getElementById(
      `${this.id}-decimal`
    ) as HTMLInputElement;
    const exponentInput = document.getElementById(
      `${this.id}-exponent`
    ) as HTMLInputElement;
    const decimal = parseFloat(decimalInput.value);
    const exponent = parseInt(exponentInput.value, 10);

    if (
      isNaN(decimal) ||
      isNaN(exponent) ||
      (!this.allowZero && decimal === 0)
    ) {
      decimalInput.classList.add("invalid-input");
      exponentInput.classList.add("invalid-input");
    } else {
      decimalInput.classList.remove("invalid-input");
      exponentInput.classList.remove("invalid-input");
      const newValue = decimal * Math.pow(10, exponent);
      this.value = newValue;
      this.onUpdate(newValue);
    }
  }

  setValue(value: number): void {
    this.value = value;
    let [decimal, exponent] = value.toExponential().split("e");
    if (parseInt(exponent) === 0) {
      exponent = "0";
    }

    const decimalInput = document.getElementById(
      `${this.id}-decimal`
    ) as HTMLInputElement;
    const exponentInput = document.getElementById(
      `${this.id}-exponent`
    ) as HTMLInputElement;

    decimalInput.value = parseFloat(decimal).toString();
    exponentInput.value = parseInt(exponent).toString();
  }
}

export class PanelButtonField extends PanelField {
  buttonText: string;
  onClick: () => void;

  constructor(
    id: string,
    label: string,
    buttonText: string,
    onClick: () => void
  ) {
    super(id, label);
    this.buttonText = buttonText;
    this.onClick = onClick;
  }

  getHTML() {
    return `
      <div>
        <label>${this.label}</label>
        <button id="${this.id}">${this.buttonText}</button>
      </div>
    `;
  }

  attachEvents() {
    document.getElementById(this.id)?.addEventListener("click", this.onClick);
  }
}

class PanelManager {
  panels: Panel[];
  container: HTMLElement;

  constructor(containerId: string, sandbox: Sandbox) {
    this.panels = [];
    this.container = document.getElementById(containerId) as HTMLElement;

    sandbox.on("entityAdded", this.onEntityAdded.bind(this));
    sandbox.on("entityRemoved", this.onEntityRemoved.bind(this));
    sandbox.on("entityUpdated", this.onEntityUpdated.bind(this));
    sandbox.on("fieldAdded", this.onFieldAdded.bind(this));
    sandbox.on("fieldRemoved", this.onFieldRemoved.bind(this));
  }

  addPanel(panel: Panel) {
    this.panels.push(panel);
    this.container.innerHTML += panel.getHTML();
    for (const panel of this.panels) {
      panel.attachEvents();
    }
  }

  removePanel(panelId: string) {
    const panel = this.panels.find((p) => p.id === panelId);
    if (panel) {
      this.panels = this.panels.filter((p) => p !== panel);
      const panelElement = document.getElementById(panelId);
      if (panelElement) {
        panelElement.remove();
      }
    }
  }

  getPanelField(
    panelId: string,
    fieldId: string
  ): ValuePanelField<any> | undefined {
    const panel = this.panels.find((p) => p.id === panelId);
    if (panel) {
      return panel.fields.find((f) => f.id === fieldId) as ValuePanelField<any>;
    }
    return undefined;
  }

  onEntityAdded(entity: PhysicalEntity) {
    if (entity instanceof Charge) {
      const chargePanel = new Panel(`charge-${entity.uuid}`, "Charge", [
        new PanelValueScientificField(
          `charge-${entity.uuid}-value`,
          "Charge",
          "C",
          entity.value,
          (value) => {
            entity.setCharge(value);
          },
          undefined,
          false
        ),
        new PanelValueScientificField(
          `mass-${entity.uuid}`,
          "Mass",
          "kg",
          entity.mass,
          (value) => {
            entity.mass = value;
          },
          undefined,
          false
        ),
        new PanelValueScientificField(
          `velocity-${entity.uuid}`,
          "Velocity",
          "m/s",
          entity.velocity.length(),
          (value) => {
            if (entity.velocity.length() === 0) {
              entity.velocity = new THREE.Vector3(0, value, 0);
            } else {
              entity.velocity.setLength(
                (value * sandbox.context.distanceUnit) /
                  sandbox.context.timeUnit
              );
            }
          }
        ),
        new PanelValueToggleField(
          `show-velocity-${entity.uuid}`,
          "Show Velocity",
          entity.showVelocity,
          (value) => {
            entity.setShowVelocity(value);
          }
        ),
        new PanelValueToggleField(
          `show-acceleration-${entity.uuid}`,
          "Show Acceleration",
          entity.showAcceleration,
          (value) => {
            entity.setShowAcceleration(value, sandbox);
          }
        ),
      ]);
      this.addPanel(chargePanel);
    }
  }

  onEntityRemoved(entity: PhysicalEntity) {
    this.removePanel(`charge-${entity.uuid}`);
  }

  onEntityUpdated(entity: PhysicalEntity) {
    if (entity instanceof Charge) {
      if (entity.velocity.length() === 0) {
        selectManager.updateButtons();
      }

      const velocityPanel = this.getPanelField(
        `charge-${entity.uuid}`,
        `velocity-${entity.uuid}`
      ) as PanelValueScientificField;
      if (velocityPanel) {
        if (velocityPanel.value === 0 && entity.velocity.length() !== 0) {
          selectManager.updateButtons();
        }

        velocityPanel.setValue(
          (entity.velocity.length() * sandbox.context.timeUnit) /
            sandbox.context.distanceUnit
        );
      }
    }
  }

  onFieldAdded(field: Field) {
    if (field instanceof MagneticField) {
      const magneticFieldPanel = new Panel(
        `magnetic-field-${field.uuid}`,
        "Magnetic Field",
        [
          new PanelValueScientificField(
            `strength-${field.uuid}`,
            "Strength",
            "T",
            field.value.length(),
            (value) => {
              field.value.setLength(value);
            },
            undefined,
            false
          ),
          new PanelButtonField(
            `rotate-${field.uuid}`,
            "Rotate Field",
            "Rotate",
            () => {
              selectManager.deselect();
              selectManager.selectField(field);
            }
          ),
        ]
      );
      this.addPanel(magneticFieldPanel);
    } else if (field instanceof ElectricField) {
      const electricFieldPanel = new Panel(
        `electric-field-${field.uuid}`,
        "Electric Field",
        [
          new PanelValueScientificField(
            `strength-${field.uuid}`,
            "Strength",
            "N/C",
            field.value.length(),
            (value) => {
              field.value.setLength(value);
            },
            undefined,
            false
          ),
          new PanelButtonField(
            `rotate-${field.uuid}`,
            "Rotate Field",
            "Rotate",
            () => {
              selectManager.deselect();
              selectManager.selectField(field);
            }
          ),
        ]
      );
      this.addPanel(electricFieldPanel);
    }
  }

  onFieldRemoved(field: Field) {
    if (field instanceof MagneticField) {
      this.removePanel(`magnetic-field-${field.uuid}`);
    } else if (field instanceof ElectricField) {
      this.removePanel(`electric-field-${field.uuid}`);
    }
  }
}

function rotateCameraToTopView() {
  rotateCameraToPosition(0, 1, 0);
}

function rotateCameraToFrontView() {
  rotateCameraToPosition(0, 0, 1);
}

function rotateCameraToSideView() {
  rotateCameraToPosition(1, 0, 0);
}

document
  .getElementById("top-face")
  ?.addEventListener("click", rotateCameraToTopView);
document
  .getElementById("front-face")
  ?.addEventListener("click", rotateCameraToFrontView);
document
  .getElementById("side-face")
  ?.addEventListener("click", rotateCameraToSideView);

document.getElementById("play-pause")?.addEventListener("click", () => {
  const icon = document.getElementById("play-pause-icon") as HTMLImageElement;
  if (sandbox.status === SandboxStatus.PLAYING) {
    sandbox.pause();
    icon.src = "play.svg";
  } else {
    sandbox.play();
    icon.src = "pause.svg";
  }
});

document.getElementById("reset")?.addEventListener("click", () => {
  sandbox.reset();
  const icon = document.getElementById("play-pause-icon") as HTMLImageElement;
  icon.src = "/play.svg";
});

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

export const panelManager = new PanelManager("panels-container", sandbox);

const sandboxPanel = new Panel("sandbox", "Sandbox Settings", [
  new PanelValueSliderField(
    "time-unit",
    "Time Unit",
    -10,
    10,
    0,
    (value) => {
      sandbox.context.timeUnit = Math.pow(10, value);
    },
    (value) => `10<sup>${value}</sup> s`
  ),
  new PanelValueSliderField(
    "distance-unit",
    "Distance Unit",
    -10,
    10,
    0,
    (value) => {
      sandbox.context.distanceUnit = Math.pow(10, value);
    },
    (value) =>
      `i&#770; = 10<sup>${value}</sup> m; j&#770; = 10<sup>${value}</sup> m; k&#770; = 10<sup>${value}</sup> m`
  ),
  new PanelValueToggleField(
    "ignore-gravity",
    "Ignore Gravity",
    true,
    (value) => {
      sandbox.context.ignoreGravity = value;
    }
  ),
]);

panelManager.addPanel(sandboxPanel);

const moveButton = document.getElementById("move")!;
const rotateButton = document.getElementById("rotate")!;
const chargeButton = document.getElementById("charge")!;
const electricField = document.getElementById("electric-field")!;
const magneticField = document.getElementById("magnetic-field")!;

class SelectManager {
  private sandbox: Sandbox;
  private selectedEntity: PhysicalEntity | Field | null;
  private transformControls: TransformControls;
  private scene: THREE.Scene;
  private mode: "translate" | "rotate" | null;
  private rotationObject: THREE.Object3D | null;

  constructor(
    sandbox: Sandbox,
    transformControls: TransformControls,
    scene: THREE.Scene
  ) {
    this.sandbox = sandbox;
    this.transformControls = transformControls;
    this.scene = scene;
    this.selectedEntity = null;
    this.mode = null;
    this.rotationObject = null;

    moveButton.addEventListener("click", () => this.updateMode("translate"));
    rotateButton.addEventListener("click", () => this.updateMode("rotate"));

    this.transformControls.addEventListener(
      "change",
      this.onTransformChange.bind(this)
    );

    this.updateButtons();
  }

  private onTransformChange() {
    if (this.selectedEntity instanceof Field && this.rotationObject) {
      const direction = new THREE.Vector3();
      this.rotationObject.getWorldDirection(direction);
      direction.normalize().multiplyScalar(this.selectedEntity.value.length());
      this.selectedEntity.value.copy(direction);
    } else if (this.selectedEntity instanceof Charge && this.rotationObject) {
      const direction = new THREE.Vector3();
      this.rotationObject.getWorldDirection(direction);
      direction
        .normalize()
        .multiplyScalar(this.selectedEntity.velocity.length());
      this.selectedEntity.velocity.copy(direction);
    }
  }

  onIntersects(intersects: THREE.Intersection[]) {
    if (intersects.length > 0) {
      let selectedNewEntity = false;
      for (const intersect of intersects) {
        if (selectedNewEntity) break;
        selectedNewEntity = selectedNewEntity || this.selectObject(intersect);
      }
    }

    this.updateButtons();
  }

  private selectObject(intersect: THREE.Intersection) {
    const entity = this.sandbox.entities.find(
      (entity) => entity.object === intersect.object
    );

    if (entity && entity !== this.selectedEntity) {
      this.selectedEntity = entity;
      this.transformControls.attach(entity.object);
      this.scene.add(this.transformControls.getHelper());
      this.updateMode("translate");
      return true;
    } else if (entity === this.selectedEntity) {
      return true;
    }

    return false;
  }

  selectField(field: Field) {
    if (field !== this.selectedEntity) {
      this.selectedEntity = field;
      this.rotationObject = new THREE.Object3D();
      this.rotationObject.position.copy(orbitControls.target);
      this.rotationObject.lookAt(field.value);
      this.scene.add(this.rotationObject);
      this.transformControls.attach(this.rotationObject);
      this.scene.add(this.transformControls.getHelper());
      this.updateMode("rotate");
      return true;
    }
    return false;
  }

  deselect() {
    if (this.selectedEntity) {
      this.transformControls.detach();
      this.scene.remove(this.transformControls.getHelper());
      if (this.rotationObject) {
        this.scene.remove(this.rotationObject);
        this.rotationObject = null;
      }
    }
    this.selectedEntity = null;
    this.mode = null;
    this.updateButtons();
  }

  updateMode(mode: "translate" | "rotate" | null) {
    if (mode) {
      if (mode === this.mode) {
        mode = null;
        this.deselect();
        return;
      }
      this.transformControls.setMode(mode);

      if (mode === "rotate") {
        if (this.selectedEntity instanceof Charge) {
          this.rotationObject = new THREE.Object3D();
          this.rotationObject.position.copy(
            this.selectedEntity.object.position
          );
          this.rotationObject.lookAt(
            this.selectedEntity.velocity
              .clone()
              .normalize()
              .add(this.selectedEntity.object.position)
          );
          this.scene.add(this.rotationObject);
          this.transformControls.attach(this.rotationObject);
        }
      }
    } else {
      this.deselect();
    }

    this.mode = mode;
    this.updateButtons();
  }

  private updateButton(
    button: HTMLElement,
    mode: "disabled" | "enabled" | "selected" | "loading"
  ) {
    button.classList.remove(
      "button-disabled",
      "button-enabled",
      "button-selected",
      "button-loading"
    );
    button.classList.add(`button-${mode}`);
  }

  updateButtons() {
    if (this.selectedEntity instanceof Field) {
      this.updateButton(moveButton, "disabled");
      this.updateButton(rotateButton, "enabled");
    } else if (this.selectedEntity instanceof Charge) {
      if (this.mode) {
        if (this.mode === "translate") {
          this.updateButton(moveButton, "selected");
          if (this.selectedEntity.velocity.length() !== 0) {
            this.updateButton(rotateButton, "enabled");
          } else {
            this.updateButton(rotateButton, "disabled");
          }
        } else if (this.mode === "rotate") {
          this.updateButton(rotateButton, "selected");
          this.updateButton(moveButton, "enabled");
        }
      } else {
        this.updateButton(moveButton, "enabled");
        if (this.selectedEntity.velocity.length() !== 0) {
          this.updateButton(rotateButton, "enabled");
        } else {
          this.updateButton(rotateButton, "disabled");
        }
      }
    } else {
      this.updateButton(moveButton, "disabled");
      this.updateButton(rotateButton, "disabled");
    }

    if (protonModel && electronModel) {
      this.updateButton(chargeButton, "enabled");
    } else {
      this.updateButton(chargeButton, "loading");
    }
  }

  onChargeLoad() {
    this.updateButtons();
  }
}

chargeButton.addEventListener("click", () => {
  selectManager.deselect();

  if (protonModel && electronModel) {
    sandbox.appendEntity(
      new Charge(-1, new THREE.Vector3(0, 0, 0), orbitControls.target)
    );
  }
});

electricField.addEventListener("click", () => {
  selectManager.deselect();
  sandbox.addField(new ElectricField(new THREE.Vector3(0, 1, 0)));
});

magneticField.addEventListener("click", () => {
  selectManager.deselect();
  sandbox.addField(new MagneticField(new THREE.Vector3(0, 1, 0)));
});

export const selectManager = new SelectManager(
  sandbox,
  transformControls,
  sandbox.scene
);
