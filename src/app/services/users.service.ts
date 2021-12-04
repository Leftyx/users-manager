import { Injectable } from '@angular/core';
import {
  doc,
  Firestore,
  collectionData,
  collection,
  DocumentData,
  CollectionReference,
  WithFieldValue,
  FirestoreDataConverter,
  QueryDocumentSnapshot,
  SnapshotOptions,
  docData,
  addDoc,
  deleteDoc,
  updateDoc,
  DocumentReference,
  query,
  where} from '@angular/fire/firestore';
import { EMPTY, Observable, of } from 'rxjs';
import { Functions, httpsCallableData } from '@angular/fire/functions';
import ShortUniqueId from 'short-unique-id';
import { User, Role, Result, Entity } from '../models';

const converter: FirestoreDataConverter<User> = {
  toFirestore(user: WithFieldValue<User>): DocumentData {
    return { ...user };
  },
  fromFirestore(
    snapshot: QueryDocumentSnapshot,
    options: SnapshotOptions
  ): User {
    const data = snapshot.data(options)!;
    return { ...data } as User;
  }
};

@Injectable({
  providedIn: 'root'
})
export class UsersService {

  private firebaseFunction: (data: Entity) => Observable<Result>;
  private firestoreCollection: CollectionReference<User>;
  // private response$: Observable<any> = EMPTY;

  constructor(private readonly firestore: Firestore, private readonly firebaseFunctions: Functions) {
    this.firebaseFunction = httpsCallableData(firebaseFunctions, 'manageUsers', { timeout: 3_000 });
    this.firestoreCollection = collection(firestore, 'users').withConverter<User>(converter);
  }

  getRoles(): Observable<Role[]> {
    const roles: Role[] = [
      { id: this.getUUID(), name: 'Users' },
      { id: this.getUUID(), name: 'Administrators' },
      { id: this.getUUID(), name: 'Power Users' },
    ];
    return of(roles);
  }

  getUsers(keyWord?: string): Observable<User[]> {
    let usersQuery = query<User>(this.firestoreCollection);

    if (keyWord) {
      // Don't quite understand how to chain query ... or create start with expressions.
      // usersQuery = query<User>(this.firestoreCollection,
      //   where('name', '>=', keyWord), where('role', '>=', keyWord));
      usersQuery = query<User>(this.firestoreCollection,
        where('name', '>=', keyWord));
    }

    return collectionData<User>(query<User>(usersQuery), { idField: 'id' }) as Observable<User[]>;
  }

  getUserById(id: string): Observable<User> {
    const userDocRef = this.getUserDocumentReferenceById(id);
    if (!userDocRef) { return EMPTY; }
    return docData<User>(userDocRef, { idField: 'id' }) as Observable<User>;
  }

  async addUser(user: User): Promise<User | string> {
    user.id = this.getUUID();
    user.created = new Date();
    const result = addDoc<User>(this.firestoreCollection, user);
    return await result
        .then(() => user)
        .catch((reason: any) => {
          return this.returnError(reason?.message);
        });
  }

  async updateUser(user: User): Promise<User | string> {
    const userDocRef = this.getUserDocumentReference(user);
    if (!userDocRef) {
      return this.returnError('Cannot find document.');
    }
    user.updated = new Date();
    const result = updateDoc<User>(userDocRef, { ...user });
    return await result
        .then(() => user)
        .catch((reason: any) => {
          return this.returnError(reason?.message);
        });
  }

  async deleteUser(id: string): Promise<void | string> {
    const userDocRef = this.getUserDocumentReferenceById(id);
    if (!userDocRef) {
      return this.returnError('Cannot find document.');
    }
    const result = deleteDoc(userDocRef);
    return await result
      .catch((reason: any) => {
        return this.returnError(reason?.message);
      });
  }

  deleteUserViaFunctions = (id: string): Observable<Result> | undefined => {
     if (!id) { return; }
     return this.firebaseFunction({ id: id });
  }

  private getUserDocumentReference(user: User): DocumentReference<User> | undefined {
    if (!user || !user.id) { return undefined; }
    return doc<User>(this.firestoreCollection, `${user.id}`);
  }

  private getUserDocumentReferenceById(id: string): DocumentReference<User> | undefined {
    if (!id) { return undefined; }
    return doc<User>(this.firestoreCollection, `${id}`);
  }

  private getUUID = (): string => new ShortUniqueId().stamp(32);

  private returnError = (message: string): Promise<string> => new Promise<string>((resolve, reject) => { reject(message || 'Error'); });
}
