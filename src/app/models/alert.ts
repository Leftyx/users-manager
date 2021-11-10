export enum AlertType {
  Success = 'success',
  Error = 'danger',
  Warning = 'warning',
  Inf = 'info'
}
export class Alert {
  message!: string;
  type!: AlertType;

  constructor(type: AlertType, message: string) {
    this.type = type;
    this.message = message;
  }
}
