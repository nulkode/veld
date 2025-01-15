export abstract class Component {
  abstract getHTML(): string;
  abstract attachEvents(): void;
}
