import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { doc, setDoc, Firestore, collectionData, collection, DocumentData, CollectionReference, collectionGroup, query, where, getDocs, WithFieldValue, FirestoreDataConverter, QueryDocumentSnapshot, SnapshotOptions, QueryConstraint, orderBy, Query } from '@angular/fire/firestore';
import { fromEvent, EMPTY, never, Observable, Subject, take } from 'rxjs';
import { Functions, httpsCallableData } from '@angular/fire/functions';
import { UsersService } from '../../services/users.service';
import { User, Role, Alert, Result} from '../../models';
import { debounceTime, distinctUntilChanged, filter, map, switchMap } from 'rxjs/operators';
import { AlertType } from 'src/app/models/alert';

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

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss']
})
export class UsersComponent implements OnInit {

  searchKey: string = '';
  currentUser: User | undefined;
  loading = false;
  users$: Observable<User[]> = EMPTY;
  roles$: Observable<Role[]> = EMPTY;
  // firestoreCollection: CollectionReference<User>;
  showModal = false;
  openConfirmModal: boolean = false;
  alert: Alert | undefined;

  constructor(private readonly usersService: UsersService) {
    // this.firestoreCollection = collection(firestore, 'users').withConverter<User>(converter);
  }

  ngOnInit(): void {
    this.bindSearchBox();
    this.loadRoles();
    this.loadUsers();
  }

  private bindSearchBox() {
    const searchBox = document.getElementById('search-box') as HTMLInputElement;
    const typeahead = fromEvent(searchBox, 'input').pipe(
      map(e => (e.target as HTMLInputElement).value),
      // filter(text => text.length > 1),
      debounceTime(500),
      distinctUntilChanged(),
      // switchMap((searchTerm: string) => {
      //   return searchTerm;
      // })
    );
    typeahead.subscribe((searchTerm: string) => {
      console.log('Search:', searchTerm);
      // this.searchQuery = query<User>(this.firestoreCollection, where('name', '>=', searchTerm));
      this.loadUsers(searchTerm);
    });
  }

  onAdd() {
    this.emptyCurrentUser();
    this.showModal = true;
  }

  onEdit(user: User) {
    this.currentUser = user;
    this.showModal = true;
  }

  // searchUsers(searchText: string) {
  //   debugger;
  //   if (!searchText) {
  //     this.searchQuery = query<User>(this.firestoreCollection);
  //   }
  //   this.searchQuery = query<User>(this.firestoreCollection, where('name', '==', searchText));
  // }

  async onDelete(user: User) {
    this.currentUser = user;
    this.openConfirmModal = true;
  }

  async onConfirmDelete() {
    if (!this.currentUser) { return; }

    this.openConfirmModal = false;

    const result = this.usersService.deleteUserViaFunctions(this.currentUser.id || '');
    if (!result) {
      this.showAlert(AlertType.Error, 'Something went wrong.');
      return;
    }

    result.pipe(take(1)).subscribe((result: Result) => {
      if (result.success) {
        this.showAlert(AlertType.Success, 'User deleted successfully.');
      } else {
        this.showAlert(AlertType.Error, 'Something went wrong.');
      }
    });

  }

  onCancel() {
    this.showModal = false;
  }

  async onSave() {

    if (!this.currentUser || !this.currentUser.name || !this.currentUser.role) {
      this.showAlert(AlertType.Error, 'Validation error.');
      return;
    }

    this.showModal = false;

    let upsertUser: Promise<User | string>;

    if (this.currentUser.id) {
      upsertUser = this.usersService.updateUser(this.currentUser);
    } else {
      upsertUser = this.usersService.addUser(this.currentUser);
    }

    await upsertUser.then((result) => {
        this.showAlert(AlertType.Success, 'User updated successfully.');
      })
      .catch((reason) => {
        this.showAlert(AlertType.Error, reason.message);
      });
  }

  private loadRoles() {
    this.roles$ = this.usersService.getRoles();
    this.roles$.subscribe();
  }

  private loadUsers(searchTerm?: string) {
    this.users$ = this.usersService.getUsers(searchTerm);
    this.users$.subscribe();
  }

  private emptyCurrentUser = (): void => {
    this.currentUser = { name: '', role: '', enabled: true } as User;
  };

  private showAlert(type: AlertType, message: string): void {
    this.alert = new Alert(type, message);
    setTimeout(() => { this.alert = undefined; }, 3000);
  }
}
