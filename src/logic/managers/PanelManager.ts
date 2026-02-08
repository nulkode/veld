import { followManager, sandbox } from '@/renderer';
import { Charge } from '@/logic/physics/entities/Charge';
import { Field } from '@/logic/physics/fields/Field';
import { ElectricField } from '@/logic/physics/fields/ElectricField';
import { MagneticField } from '@/logic/physics/fields/MagneticField';
import { PhysicalEntity } from '@/logic/physics/entities/PhysicalEntity';
import { selectManager } from '@/ui';
import { Panel, PanelButton, TogglePanelButton } from '@/ui/components/Panel';
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
    sandbox.on('contextUpdate', this.contextUpdate.bind(this));

    followManager.on('follow', this.onEntityFollowed.bind(this));
  }

  createSandboxPanel() {
    const sandboxPanel = new Panel('sandbox', 'panels.sandbox.title', [
      new PanelValueSliderField(
        'time-unit',
        'panels.sandbox.timeUnit',
        -10,
        10,
        0,
        value => {
          sandbox.context.timeUnit = 1 / Math.pow(10, value);
        },
        value => `1 s → 10<sup>${value}</sup> s`
      ),
      new PanelValueSliderField(
        'distance-unit',
        'panels.sandbox.distanceUnit',
        -10,
        10,
        0,
        value => {
          sandbox.updateDistanceUnit(1 / Math.pow(10, value));
        },
        value =>
          `i&#770; = 10<sup>${value}</sup> m; j&#770; = 10<sup>${value}</sup> m; k&#770; = 10<sup>${value}</sup> m`
      ),
      new PanelValueToggleField(
        'ignore-gravity',
        'panels.sandbox.ignoreGravity',
        true,
        value => {
          sandbox.context.ignoreGravity = value;
        }
      )
    ]);
    this.addPanel(sandboxPanel);
  }

  addPanel(panel: Panel) {
    this.panels.push(panel);
    this.refresh();
  }

  removePanel(panelId: string) {
    const panel = this.panels.find(p => p.id === panelId);
    if (panel) {
      this.panels = this.panels.filter(p => p !== panel);
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
    const panel = this.panels.find(p => p.id === panelId);
    if (panel) {
      return panel.fields.find(f => f.id === fieldId) as ValuePanelField<any>;
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
            value => {
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
            value => {
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
            value => {
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
            entity.visuals.velocity,
            value => {
              entity.visuals.velocity = value;
            }
          ),
          new PanelValueToggleField(
            `show-acceleration-${entity.uuid}`,
            'panels.charge.showAcceleration',
            entity.visuals.acceleration,
            value => {
              entity.visuals.acceleration = value;
            }
          ),
          new PanelValueToggleField(
            `show-trajectory-${entity.uuid}`,
            'panels.charge.showTrajectory',
            entity.visuals.trajectory,
            value => {
              entity.visuals.trajectory = value;
            }
          )
        ],
        [
          new TogglePanelButton(
            `follow-${entity.uuid}`,
            `<img src="${import.meta.env.BASE_URL}icons/camera-follow.svg" style="width: 20px; height: 20px; margin: -5px">`,
            value => {
              if (value) {
                followManager.follow(entity);
              } else {
                followManager.unfollow();
              }
            },
            0xc49600,
            false
          ),
          new PanelButton(
            `delete-${entity.uuid}`,
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

  onEntityFollowed(entity: PhysicalEntity) {
    for (const panel of this.panels) {
      const followButtons = panel.buttons.filter(button =>
        button.id.startsWith('follow-')
      );

      for (const button of followButtons) {
        if (button instanceof TogglePanelButton) {
          button.setValue(button.id === `follow-${entity.uuid}`);
        }
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
      value => {
        field.arrowColor = value;
      }
    );

    const toggleVisibilityField = new PanelValueToggleField(
      `show-${field.uuid}`,
      'panels.magneticField.showField',
      field.visible,
      value => {
        field.visible = value;
      }
    );

    const deleteButton = new PanelButton(
      `delete-${field.uuid}`,
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
            value => {
              field.value.setLength(value);
            },
            undefined,
            false,
            false
          ),
          colorField,
          toggleVisibilityField,
          new PanelValueToggleField(
            `show-cross-product-plane-${field.uuid}`,
            'panels.magneticField.showCrossProductPlane',
            field.showCrossProductPlane,
            value => {
              field.showCrossProductPlane = value;
            }
          ),
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
            value => {
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

  contextUpdate() {
    const contextPanel = this.panels.find(p => p.id === 'sandbox');

    if (contextPanel) {
      const timeUnitField = contextPanel.fields.find(
        f => f.id === 'time-unit'
      ) as ValuePanelField<number>;
      if (timeUnitField) {
        timeUnitField.setValue(Math.log10(1 / sandbox.context.timeUnit));
      }

      const distanceUnitField = contextPanel.fields.find(
        f => f.id === 'distance-unit'
      ) as ValuePanelField<number>;
      if (distanceUnitField) {
        distanceUnitField.setValue(
          Math.log10(1 / sandbox.context.distanceUnit)
        );
      }

      const ignoreGravityField = contextPanel.fields.find(
        f => f.id === 'ignore-gravity'
      ) as ValuePanelField<boolean>;
      if (ignoreGravityField) {
        ignoreGravityField.setValue(sandbox.context.ignoreGravity);
      }
    }
  }

  refresh() {
    this.container.innerHTML = this.panels.map(p => p.getHTML()).join('');
    for (const panel of this.panels) {
      panel.attachEvents();
    }
  }
}
