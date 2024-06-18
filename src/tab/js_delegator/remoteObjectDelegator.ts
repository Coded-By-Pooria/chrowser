import Protocol from 'devtools-protocol';
export default class RemoteObjectDelegator {
  constructor(private ro: Protocol.Runtime.RemoteObject) {}

  get id() {
    return this.ro.objectId!;
  }

  get type() {
    return this.ro.type!;
  }

  get subType() {
    return this.ro.subtype;
  }

  get description() {
    return this.ro.description;
  }
}
