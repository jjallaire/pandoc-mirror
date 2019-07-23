

export class Editor {

  private place: HTMLElement;

  constructor(place: HTMLElement) {
    this.place = place;
  }

  public inject() : void {
    this.place.innerText = "injected";
  }


}