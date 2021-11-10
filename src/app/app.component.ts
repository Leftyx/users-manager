import { Component, OnInit, OnDestroy } from '@angular/core';
import { Firestore, collectionData, collection, DocumentData, collectionGroup, query, where, getDocs } from '@angular/fire/firestore';
import { EMPTY, Observable, Subject, take } from 'rxjs';
import { Functions, httpsCallableData } from '@angular/fire/functions';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {

}
