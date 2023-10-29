import { buildSchema } from 'graphql'
import { FrameSideCells } from '../models/frameSideCells'
import { FrameSideFile } from '../models/frameSideFile'

export type FrameType = 'VOID' | 'FOUNDATION' | 'EMPTY_COMB' | 'PARTITION' | 'FEEDER'
export type FrameSide = {
  frameId?: number
  cells?: FrameSideCells
  frameSideFile?: FrameSideFile
}
export type Frame = {
  id: number
	position: number
  type: FrameType
  leftSide?: FrameSide
  rightSide?: FrameSide

  leftId: number
  rightId: number
}

export type Family = {
  hiveId?: number //reference
  id: number
  race: string
  added: string
}


export const schemaSDL = `
type Apiary {
    id: ID!
    name: String
    hives: [Hive]
    location: String
    lat: String
    lng: String
  }
  
  input ApiaryInput {
    name: String!
    lat: String
    lng: String
  }
  
  type Box {
    id: ID!
    position: Int
    color: String
    type: BoxType!
    frames: [Frame]
  }
  
  input BoxInput {
    id: ID
    position: Int!
    color: String
    type: BoxType!
    frames: [FrameInput]
  
    # ignored, added for frontend ease
    hiveId: Int
    family: FamilyInput
  }
  
  type Locale{
    id: ID
    en: String
    ru: String
    et: String
    pl: String
    tr: String
  }

  enum BoxType {
    DEEP
    SUPER
  }
  
  union CancelSubscriptionResult = User | Error
  
  scalar DateTime
  
  type Error {
    code: String
  }
  
  type Family {
    id: ID!
    race: String
    added: String
  }
  
  input FamilyInput {
    id: ID
    race: String
    added: String
  }
  
  type File {
    id: ID!
    url: String
  }
  
  input FilesUpdateInput {
    hiveId: ID!
    frameSideId: ID!
    fileId: ID!
    strokeHistory: JSON!
  }
  
  type Frame {
    id: ID
    position: Int!
    type: FrameType!
    leftSide: FrameSide
    rightSide: FrameSide
  }
  
  input FrameInput {
    id: ID
    position: Int!
    type: FrameType!
    leftSide: FrameSideInput
    rightSide: FrameSideInput
  
    # ignored, added for frontend ease
    boxIndex: Int
  
    # ignored, added for frontend ease
    hiveId: Int
  }
  
  type FrameSide {
    id: ID
    file: File
    cells: FrameSideCells
  }
  
  type FrameSideFile {
    id: ID!
    file: File!
    frameSideId: ID
    hiveId: ID
    strokeHistory: JSON
    detectedBees: JSON
    detectedCells: JSON
    detectedQueenCups: JSON

    queenDetected: Boolean!
  }

  type FrameSideCells {
    id: ID!
    frameSideId: ID

    broodPercent: Int
    cappedBroodPercent: Int
    eggsPercent: Int
    pollenPercent: Int
    honeyPercent: Int
  }
  
  input FrameSideInput {
    id: ID
  }
  input FrameSideCellsInput {
    id: ID
    broodPercent: Int
    cappedBroodPercent: Int
    eggsPercent: Int
    pollenPercent: Int
    honeyPercent: Int
  }
  
  enum FrameType {
    VOID
    FOUNDATION
    EMPTY_COMB
    PARTITION
    FEEDER
  }
  
  type Hive {
    id: ID!
    files: [FrameSideFile]
    name: String
    notes: String
    boxCount: Int!
    boxes: [Box]
    family: Family
    inspections(limit: Int): [Inspection]
  }
  
  input HiveInput {
    apiaryId: ID!
    name: String!
    boxCount: Int!
    frameCount: Int!
    colors: [String]
  }
  
  input HiveUpdateInput {
    id: ID!
    name: String
    notes: String
    boxes: [BoxInput]
    family: FamilyInput
  }
  
  type Inspection {
    id: ID!
    data: JSON!
    added: DateTime!
  }
  
  input InspectionInput {
    hiveId: Int!
    data: JSON!
  }
  
  type Invoice {
    id: ID!
    total: Float
    currency: String
    date: DateTime
    url: URL
  }
  
  scalar JSON
  
  union LoginResult = UserSession | Error
  
  # The mutation type, represents all updates we can make to our data
  type Mutation {
    uploadFrameSide(file: Upload!): File
    addFileToFrameSide(frameSideId: ID!, fileId: ID!, hiveId: ID!): Boolean
    filesStrokeEditMutation(files: [FilesUpdateInput]): Boolean
    addApiary(apiary: ApiaryInput!): Apiary
    updateApiary(id: ID!, apiary: ApiaryInput!): Apiary
    deactivateApiary(id: ID!): Boolean
    addHive(hive: HiveInput!): Hive
    updateHive(hive: HiveUpdateInput!): Hive
    deactivateHive(id: ID!): Boolean
    addInspection(inspection: InspectionInput!): Inspection
    register(email: String, password: String): LoginResult
    login(email: String, password: String): LoginResult
    updateUser(user: UserUpdateInput!): UpdateUserResult
    createCheckoutSession: URL
    cancelSubscription: CancelSubscriptionResult
    updateFrameSideCells(cells: FrameSideCellsInput!): Boolean!
  }
  
  type Plant {
    gbifID: ID
    URL: URL
    scientificName: String
    distance: Float
    images: [PlantImage]
  }
  
  type PlantImage {
    URL: URL
    title: String
    source: String
    created: DateTime
    creator: String
  }
  
  # The query type, represents all of the entry points into our object graph
  type Query {
    file(id: ID!): File
    hiveFiles(hiveId: ID!): [FrameSideFile]
    hiveFrameSideFile(frameSideId: ID!): FrameSideFile
    hiveFrameSideCells(frameSideId: ID!): FrameSideCells
    plants(lat: String!, lng: String!): [Plant]
    hive(id: ID!): Hive
    apiary(id: ID!): Apiary
    apiaries: [Apiary]
    inspection(inspectionId: ID!): Inspection
    user: User
    translate: Locale
    invoices: [Invoice]
    weather(lat: String!, lng: String!): JSON
  }
  
  union UpdateUserResult = User | Error
  
  scalar Upload
  
  scalar URL
  
  type User {
    id: ID!
    email: String
    first_name: String
    last_name: String
    date_added: DateTime
    date_expiration: DateTime
    hasSubscription: Boolean
    isSubscriptionExpired: Boolean
  }
  
  type UserSession {
    key: String
  }
  
  input UserUpdateInput {
    first_name: String
    last_name: String
  }
  
`

export const schemaObject = buildSchema(schemaSDL)
