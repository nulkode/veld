import { sandbox } from '../../renderer';
import {
  Sandbox,
  PhysicalEntity,
  Charge,
  Field,
  MagneticField,
  ElectricField,
} from '../../sandbox';
import { selectManager } from '../../ui';
import { Panel } from '../components/Panel';
import { PanelButtonField } from '../fields/Button';
import { ValuePanelField } from '../fields/PanelField';
import { PanelValueColorField } from '../fields/ValueColor';
import { PanelValueScientificField } from '../fields/ValueScientific';
import { PanelValueToggleField } from '../fields/ValueToggle';
import * as THREE from 'three';

export class PanelManager {
  panels: Panel[];
  container: HTMLElement;

  constructor(containerId: string, sandbox: Sandbox) {
    this.panels = [];
    this.container = document.getElementById(containerId) as HTMLElement;

    sandbox.on('entityAdded', this.onEntityAdded.bind(this));
    sandbox.on('entityRemoved', this.onEntityRemoved.bind(this));
    sandbox.on('entityUpdated', this.onEntityUpdated.bind(this));
    sandbox.on('fieldAdded', this.onFieldAdded.bind(this));
    sandbox.on('fieldRemoved', this.onFieldRemoved.bind(this));
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
      const chargePanel = new Panel(`charge-${entity.uuid}`, 'Charge', [
        new PanelValueScientificField(
          `charge-${entity.uuid}-value`,
          'Charge',
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
          'Mass',
          'kg',
          entity.mass,
          (value) => {
            entity.mass = value;
          },
          undefined,
          false
        ),
        new PanelValueScientificField(
          `velocity-${entity.uuid}`,
          'Velocity',
          'm/s',
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
          'Show Velocity',
          entity.showVelocity,
          (value) => {
            entity.setShowVelocity(value);
          }
        ),
        new PanelValueToggleField(
          `show-acceleration-${entity.uuid}`,
          'Show Acceleration',
          entity.showAcceleration,
          (value) => {
            entity.setShowAcceleration(value);
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
    const rotateField = new PanelButtonField(
      `rotate-${field.uuid}`,
      'Rotate Field',
      'Rotate',
      () => {
        selectManager.deselect();
        selectManager.selectField(field);
      }
    );

    const colorField = new PanelValueColorField(
      `color-${field.uuid}`,
      'Color',
      field.arrowColor,
      (value) => {
        field.arrowColor = value;
      }
    );

    if (field instanceof MagneticField) {
      const magneticFieldPanel = new Panel(
        `magnetic-field-${field.uuid}`,
        'Magnetic Field',
        [
          new PanelValueScientificField(
            `strength-${field.uuid}`,
            'Strength',
            'T',
            field.value.length(),
            (value) => {
              field.value.setLength(value);
            },
            undefined,
            false
          ),
          colorField,
          rotateField,
        ]
      );
      this.addPanel(magneticFieldPanel);
    } else if (field instanceof ElectricField) {
      const electricFieldPanel = new Panel(
        `electric-field-${field.uuid}`,
        'Electric Field',
        [
          new PanelValueScientificField(
            `strength-${field.uuid}`,
            'Strength',
            'N/C',
            field.value.length(),
            (value) => {
              field.value.setLength(value);
            },
            undefined,
            false
          ),
          colorField,
          rotateField,
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
