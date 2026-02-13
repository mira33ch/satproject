import { CommonModule } from "@angular/common";
import { SmButtonComponent } from "./ui/sm-button/sm-button.component";
import { SmInputComponent } from "./ui/sm-input/sm-input.component";
import { SmModalComponent } from "./ui/sm-modal/sm-modal.component";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { NgModule } from "@angular/core";
import { TranslateModule } from '@ngx-translate/core';
@NgModule({
  declarations: [SmButtonComponent, SmInputComponent, SmModalComponent],
  imports: [CommonModule, FormsModule, ReactiveFormsModule,TranslateModule   ],
  exports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    SmButtonComponent,
    SmInputComponent,
    SmModalComponent,
    TranslateModule,
    
  ],
})
export class SharedModule {}
