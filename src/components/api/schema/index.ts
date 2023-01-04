import { buildSchema } from 'graphql'

export type Box = {
  id: string
	type: string
	hiveId?: string
	position: number
	color: string
	frames?: Frame[]
}

export type Frame = {
  id: string
	position: number
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
    broodPercent: Int
    cappedBroodPercent: Int
    droneBroodPercent: Int
    pollenPercent: Int
    honeyPercent: Int
    queenDetected: Boolean!
    workerCount: Int
    droneCount: Int
  }
  
  type FrameSideFile {
    id: ID!
    file: File!
    frameSideId: ID
    hiveId: ID
    strokeHistory: JSON
    detectedObjects: JSON
  }
  
  input FrameSideInput {
    id: ID
    broodPercent: Int
    cappedBroodPercent: Int
    droneBroodPercent: Int
    pollenPercent: Int
    honeyPercent: Int
    queenDetected: Boolean!
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
    plants(lat: String!, lng: String!): [Plant]
    hive(id: ID!): Hive
    apiary(id: ID!): Apiary
    apiaries: [Apiary]
    inspection(inspectionId: ID!): Inspection
    user: User
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
