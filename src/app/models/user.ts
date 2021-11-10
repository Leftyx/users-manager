export interface User {
  id?: string,
  name: string,
  role: string,
  enabled: boolean,
  created: Date,
  updated?: Date
}
