import { Injectable, signal } from '@angular/core';

export interface AppNotification { id:number; type:'success'|'error'|'info'; message:string; }

@Injectable({providedIn:'root'})
export class NotificationService {
  private nextId=0;
  readonly notifications=signal<AppNotification[]>([]);
  success(message:string):void { this.show(message,'success'); }
  error(message:string):void { this.show(message,'error',7000); }
  info(message:string):void { this.show(message,'info'); }
  dismiss(id:number):void { this.notifications.update(items=>items.filter(item=>item.id!==id)); }
  private show(message:string,type:AppNotification['type'],duration=4500):void {
    const id=++this.nextId;
    this.notifications.update(items=>[...items,{id,type,message}]);
    window.setTimeout(()=>this.dismiss(id),duration);
  }
}
