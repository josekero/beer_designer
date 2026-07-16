import { Component, ElementRef, EventEmitter, HostListener, Input, Output, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export interface PickerItem {id:string;label:string;meta?:string;search?:string;inStock?:boolean;}

@Component({
 selector:'app-ingredient-picker',
 templateUrl:'./ingredient-picker.html',styleUrl:'./ingredient-picker.scss',
 providers:[{provide:NG_VALUE_ACCESSOR,useExisting:forwardRef(()=>IngredientPicker),multi:true}]
})
export class IngredientPicker implements ControlValueAccessor {
 @Input() items:PickerItem[]=[]; @Input() placeholder='Buscar ingrediente…'; @Input() ariaLabel='Ingrediente'; @Input() stockOnly=false; @Output() selectionChange=new EventEmitter<string>();
 open=false; query=''; value=''; disabled=false; activeIndex=0; private onChange=(value:string)=>{}; private onTouched=()=>{};
 constructor(private host:ElementRef<HTMLElement>){}
 get selected(){return this.items.find(item=>item.id===this.value);}
 get filtered(){const q=this.normalize(this.query);return this.items.filter(item=>(!this.stockOnly||item.inStock||item.id===this.value)&&(!q||this.normalize(`${item.label} ${item.meta??''} ${item.search??''}`).includes(q))).slice(0,40);}
 focus(){if(this.disabled)return;this.query='';this.open=true;this.activeIndex=0;}
 input(value:string){this.query=value;this.open=true;this.activeIndex=0;}
 select(item:PickerItem){this.value=item.id;this.query='';this.open=false;this.onChange(item.id);this.onTouched();this.selectionChange.emit(item.id);}
 keydown(event:KeyboardEvent){if(event.key==='ArrowDown'){event.preventDefault();this.open=true;this.activeIndex=Math.min(this.activeIndex+1,this.filtered.length-1);}else if(event.key==='ArrowUp'){event.preventDefault();this.activeIndex=Math.max(this.activeIndex-1,0);}else if(event.key==='Enter'&&this.open&&this.filtered[this.activeIndex]){event.preventDefault();this.select(this.filtered[this.activeIndex]);}else if(event.key==='Escape'){this.open=false;}}
 writeValue(value:string){this.value=value??'';} registerOnChange(fn:(value:string)=>void){this.onChange=fn;} registerOnTouched(fn:()=>void){this.onTouched=fn;} setDisabledState(value:boolean){this.disabled=value;}
 @HostListener('document:mousedown',['$event']) outside(event:MouseEvent){if(!this.host.nativeElement.contains(event.target as Node)){this.open=false;this.onTouched();}}
 private normalize(value:string){return value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();}
}
