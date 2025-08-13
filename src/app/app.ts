import { Component, signal } from "@angular/core";
import { RouterOutlet } from "@angular/router";
import { FooterComponent } from "./shared/components/footer/footer.component";
import { HeaderComponent } from "./shared/components/header/header.component";

@Component({
  selector: "app-root",
  imports: [RouterOutlet, FooterComponent, HeaderComponent],
  templateUrl: "./app.html",
  styleUrl: "./app.scss",
})
export class App {
  protected readonly title = signal("appreg-frontend");
}
