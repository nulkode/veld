import { sandbox } from '@/renderer';
import { Charge } from '@/logic/physics/entities/Charge';
import { Field } from '@/logic/physics/fields/Field';
import { ElectricField } from '@/logic/physics/fields/ElectricField';
import { MagneticField } from '@/logic/physics/fields/MagneticField';
import { PhysicalEntity } from '@/logic/physics/entities/PhysicalEntity';
import { selectManager } from '@/ui';
import { Panel, PanelButton } from '@/ui/components/Panel';
import { PanelButtonField } from '@/ui/components/fields/Button';
import { ValuePanelField } from '@/ui/components/fields/PanelField';
import { PanelValueColorField } from '@/ui/components/fields/ValueColor';
import { PanelValueScientificField } from '@/ui/components/fields/ValueScientific';
import { PanelValueToggleField } from '@/ui/components/fields/ValueToggle';
import '@/styles/panels/panels.css';
import { PanelValueSliderField } from '@/ui/components/fields/ValueSlider';
import { Vector3 } from 'three';

export class PanelManager {
  panels: Panel[];
  container: HTMLElement;

  constructor(containerId: string) {
    this.panels = [];
    this.container = document.getElementById(containerId) as HTMLElement;

    this.createSandboxPanel();

    sandbox.on('entityAdded', this.onEntityAdded.bind(this));
    sandbox.on('entityRemoved', this.onEntityRemoved.bind(this));
    sandbox.on('entityUpdated', this.onEntityUpdated.bind(this));
    sandbox.on('fieldAdded', this.onFieldAdded.bind(this));
    sandbox.on('fieldRemoved', this.onFieldRemoved.bind(this));
  }

  createSandboxPanel() {
    const sandboxPanel = new Panel('sandbox', 'panels.sandbox.title', [
      new PanelValueSliderField(
        'time-unit',
        'panels.sandbox.timeUnit',
        -10,
        10,
        0,
        (value) => {
          sandbox.context.timeUnit = 1 / Math.pow(10, value);
        },
        (value) => `1 s → 10<sup>${value}</sup> s`
      ),
      new PanelValueSliderField(
        'distance-unit',
        'panels.sandbox.distanceUnit',
        -10,
        10,
        0,
        (value) => {
          sandbox.setDistanceUnit(1 / Math.pow(10, value));
        },
        (value) =>
          `i&#770; = 10<sup>${value}</sup> m; j&#770; = 10<sup>${value}</sup> m; k&#770; = 10<sup>${value}</sup> m`
      ),
      new PanelValueToggleField(
        'ignore-gravity',
        'panels.sandbox.ignoreGravity',
        true,
        (value) => {
          sandbox.context.ignoreGravity = value;
        }
      )
    ]);
    this.addPanel(sandboxPanel);
  }

  addPanel(panel: Panel) {
    this.panels.push(panel);
    this.container.innerHTML = this.panels.map((p) => p.getHTML()).join('');
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
      const chargePanel = new Panel(
        `charge-${entity.uuid}`,
        'panels.charge.title',
        [
          new PanelValueScientificField(
            `charge-${entity.uuid}-value`,
            'panels.charge.charge',
            'C',
            entity.value,
            (value) => {
              entity.setCharge(value);
            },
            undefined,
            false
          ),
          new PanelValueScientificField(
            `mass-${entity.uuid}`,
            'panels.charge.mass',
            'kg',
            entity.mass,
            (value) => {
              entity.mass = value;
            },
            undefined,
            false,
            false
          ),
          new PanelValueScientificField(
            `velocity-${entity.uuid}`,
            'panels.charge.velocity',
            'm/s',
            entity.velocity.length(),
            (value) => {
              if (entity.velocity.length() === 0) {
                entity.velocity = new Vector3(0, value, 0);
                selectManager.updateButtons();
              } else {
                entity.velocity.setLength(value);
                if (entity.velocity.length() === 0) {
                  selectManager.updateButtons();
                  if (selectManager.mode === 'rotate') {
                    selectManager.deselect();
                  }
                }
              }
            },
            undefined,
            true,
            false
          ),
          new PanelValueToggleField(
            `show-velocity-${entity.uuid}`,
            'panels.charge.showVelocity',
            entity.showVelocity,
            (value) => {
              entity.setShowVelocity(value);
            }
          ),
          new PanelValueToggleField(
            `show-acceleration-${entity.uuid}`,
            'panels.charge.showAcceleration',
            entity.showAcceleration,
            (value) => {
              entity.setShowAcceleration(value);
            }
          )
        ],
        [
          new PanelButton(
            'delete',
            'X',
            () => {
              sandbox.deleteEntity(entity);
            },
            0xc63434,
            false
          )
        ]
      );
      this.addPanel(chargePanel);
    }
  }

  onEntityRemoved(entity: PhysicalEntity) {
    this.removePanel(`charge-${entity.uuid}`);
  }

  onEntityUpdated(entity: PhysicalEntity) {
    if (entity instanceof Charge) {
      if (entity.velocity.length() === 0 && selectManager.mode === 'rotate') {
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

        velocityPanel.setValue(entity.velocity.length());
      }
    }
  }

  onFieldAdded(field: Field) {
    const rotateField = new PanelButtonField(
      `rotate-${field.uuid}`,
      '',
      'panels.magneticField.rotate',
      () => {
        selectManager.deselect();
        selectManager.selectField(field);
      }
    );

    const colorField = new PanelValueColorField(
      `color-${field.uuid}`,
      'panels.magneticField.color',
      field.arrowColor,
      (value) => {
        field.arrowColor = value;
      }
    );

    const toggleVisibilityField = new PanelValueToggleField(
      `show-${field.uuid}`,
      'panels.magneticField.showField',
      field.visible,
      (value) => {
        field.visible = value;
      }
    );

    const deleteButton = new PanelButton(
      'delete',
      'X',
      () => {
        sandbox.deleteField(field);
      },
      0xc63434,
      false
    );

    if (field instanceof MagneticField) {
      const magneticFieldPanel = new Panel(
        `magnetic-field-${field.uuid}`,
        'panels.magneticField.title',
        [
          new PanelValueScientificField(
            `strength-${field.uuid}`,
            'panels.magneticField.strength',
            'T',
            field.value.length(),
            (value) => {
              field.value.setLength(value);
            },
            undefined,
            false,
            false
          ),
          colorField,
          toggleVisibilityField,
          rotateField
        ],
        [deleteButton]
      );
      this.addPanel(magneticFieldPanel);
    } else if (field instanceof ElectricField) {
      const electricFieldPanel = new Panel(
        `electric-field-${field.uuid}`,
        'panels.electricField.title',
        [
          new PanelValueScientificField(
            `strength-${field.uuid}`,
            'panels.electricField.strength',
            'N/C',
            field.value.length(),
            (value) => {
              field.value.setLength(value);
            },
            undefined,
            false,
            false
          ),
          colorField,
          toggleVisibilityField,
          rotateField
        ],
        [deleteButton]
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

  refresh() {
    this.container.innerHTML = this.panels.map((p) => p.getHTML()).join('');
    for (const panel of this.panels) {
      panel.attachEvents();
    }
  }
}
