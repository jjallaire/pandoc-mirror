

export class Editor {

  private place: HTMLElement;

  constructor(place: HTMLElement) {
    this.place = place;
  }

  public inject(text: string) : void {
    this.place.innerText = text;
  }


}