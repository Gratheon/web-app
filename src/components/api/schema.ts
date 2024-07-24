import { buildSchema } from 'graphql'

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

type APIToken {
  id: ID!
  token: String!
}

type Box {
  id: ID
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

  # ignored, added for frontend ease
  hiveId: Int
  family: FamilyInput
}

enum BoxType {
  DEEP
  SUPER
  GATE
  VENTILATION
  QUEEN_EXCLUDER
  HORIZONTAL_FEEDER
}

union CancelSubscriptionResult = User | Error

scalar DateTime

input DetectionStats {
  beesIn: Int
  beesOut: Int
  wespenCount: Int
  varroaCount: Int
  pollenCount: Int
  coolingCount: Int
  processedFrames: Int
}

type Error {
  code: String
}

type Family {
  id: ID!

  #  freeform race of the queen
  race: String

  #  year when queen was added
  added: String

  #  queen age in years, depends on added date
  age: Int

  #  aggregate info about Treatments
  lastTreatment: DateTime

  # Anti-varroa medical treatments of a hive or a box are linked to a family to track history even if family is moved to another hive or ownership is changed
  treatments: [Treatment]
}

input FamilyInput {
  id: ID
  race: String
  added: String
}

#  File is an abstraction of an uploaded photo of a frame.But we don't want to mix it with various properties in case we will have more uploads.for other purposes than for a frame. For example, hive bottom or hive entrance.
type File {
  id: ID!
  url: URL!
  resizes: [FileResize]
}

type FileResize {
  id: ID!
  file_id: ID!
  max_dimension_px: Int!
  url: URL!
}


#  When user draws on top of a frame photo, we want to store stroke history
input FilesUpdateInput {
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
  id: ID!
  position: Int!
  type: FrameType!

  # ignored, added for frontend ease
  boxId: ID!

  # ignored, added for frontend ease
  hiveId: Int
}

type FrameSide {
  id: ID
  file: File
  cells: FrameSideCells
  frameSideFile: FrameSideFile
  inspections: [FrameSideInspection]
}

type FrameSideCells {
  id: ID!
  broodPercent: Int
  cappedBroodPercent: Int
  eggsPercent: Int
  pollenPercent: Int
  honeyPercent: Int
}

#  FrameSideCellsInput is used to update percentage composition of a FrameSide.This is useful if automatic detection was not correct and user wants to adjust percentages
input FrameSideCellsInput {
  id: ID!
  broodPercent: Int
  cappedBroodPercent: Int
  eggsPercent: Int
  pollenPercent: Int
  honeyPercent: Int
}

#  FrameSideFile is an intermediate (join) entity that connects FrameSide with File
type FrameSideFile {
  frameSideId: ID

  file: File!
  
  hiveId: ID
  strokeHistory: JSON

  #  regions of detected bees
  detectedBees: JSON
  detectedQueenCount: Int
  detectedWorkerBeeCount: Int
  detectedDroneCount: Int
  isBeeDetectionComplete: Boolean

  #  regions of detected cells
  detectedCells: JSON
  isCellsDetectionComplete: Boolean

  #  regions of detected queen cups
  detectedQueenCups: JSON
  isQueenCupsDetectionComplete: Boolean
  queenDetected: Boolean!
  workerCount: Int
  droneCount: Int
  detectedVarroa: JSON
  varroaCount: Int
}

type FrameSideInspection {
  frameSideId: ID!
  inspectionId: ID!
  file: File
  cells: FrameSideCells
  frameSideFile: FrameSideFile
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

  # amount of bees detected on all frames. Includes all types (workers, drones, queens)
  beeCount: Int
  files: [FrameSideFile]
  name: String
  notes: String
  boxes: [Box]
  family: Family
  boxCount: Int!
  inspectionCount: Int!
  status: String
  added: DateTime!

  #  true if added < 1 day
  isNew: Boolean!
  lastInspection: DateTime
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
  family: FamilyInput
}

type Inspection {
  id: ID!
  hiveId: ID!
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

type Locale {
  id: ID!
  en: String!
  ru: String
  et: String
  tr: String
  pl: String
  de: String
  fr: String
  key: String
}

union LoginResult = UserSession | Error

# The mutation type, represents all updates we can make to our data
type Mutation {
  uploadGateVideo(file: Upload!, boxId: ID!): Boolean
  updateVideoSegmentDetectionStats(
    id: ID!
    detectionStats: DetectionStats!
  ): Boolean
  generateHiveAdvice(hiveID: ID, adviceContext: JSON, langCode: String): String
  uploadFrameSide(file: Upload!): File
  addFileToFrameSide(frameSideId: ID!, fileId: ID!, hiveId: ID!): Boolean
  filesStrokeEditMutation(files: [FilesUpdateInput]): Boolean
  updateFrameSideQueenPresense(frameSideId: ID!, isPresent: Boolean!): Boolean!
  updateFrameSideCells(cells: FrameSideCellsInput!): Boolean!

  # On inspection creation, we want to clone frames from current state (NULL references) and set inspectionId
  # Then create new set of frames with NULL frames
  cloneFramesForInspection(frameSideIDs: [ID], inspectionId: ID!): Boolean!
  addApiary(apiary: ApiaryInput!): Apiary
  updateApiary(id: ID!, apiary: ApiaryInput!): Apiary
  deactivateApiary(id: ID!): Boolean
  addHive(hive: HiveInput!): Hive
  updateHive(hive: HiveUpdateInput!): Hive
  deactivateHive(id: ID!): Boolean
  addBox(hiveId: ID!, position: Int!, color: String, type: BoxType!): Box!
  updateBoxColor(id: ID!, color: String): Boolean!
  deactivateBox(id: ID!): Boolean
  swapBoxPositions(id: ID!, id2: ID!): Boolean
  addFrame(boxId: ID!, type: String!, position: Int!): Frame!
  updateFrames(frames: [FrameInput]!): [Frame]
  deactivateFrame(id: ID!): Boolean
  addInspection(inspection: InspectionInput!): Inspection
  treatHive(treatment: TreatmentOfHiveInput!): Boolean
  treatBox(treatment: TreatmentOfBoxInput!): Boolean
  register(
    first_name: String
    last_name: String
    email: String!
    password: String!
  ): LoginResult
  login(email: String!, password: String!): LoginResult
  generateApiToken: APIToken
  generateShareToken(name: String!, scopes: JSON!, sourceUrl: URL!): ShareToken
  validateApiToken(token: String): ValidateTokenResult
  updateUser(user: UserUpdateInput!): UpdateUserResult
  createCheckoutSession: URL
  cancelSubscription: CancelSubscriptionResult
  deleteUserSelf: Error
  revokeApiToken(token: String!): Error
  revokeShareToken(token: String!): Error
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
  videoStreams(boxIds: [ID], active: Boolean): [VideoStream]
  fetchNextUnprocessedVideoSegment: VideoSegment
  file(id: ID!): File
  hiveFiles(hiveId: ID!): [FrameSideFile]
  getExistingHiveAdvice(hiveID: ID): String
  hiveFrameSideFile(frameSideId: ID!): FrameSideFile
  hiveFrameSideCells(frameSideId: ID!): FrameSideCells

  #  Gets single inspection states of frame sides (frameSideIds are optional, for extra filtering)
  frameSidesInspections(
    frameSideIds: [ID]
    inspectionId: ID!
  ): [FrameSideInspection]
  plants(lat: String!, lng: String!): [Plant]
  hive(id: ID!): Hive
  apiary(id: ID!): Apiary
  hiveFrame(id: ID!): Frame
  hiveFrameSide(id: ID!): FrameSide
  apiaries: [Apiary]
  inspection(inspectionId: ID!): Inspection
  inspections(hiveId: ID!, limit: Int): [Inspection]
  user: User
  invoices: [Invoice]
  apiTokens: [APIToken]
  shareTokens: [ShareToken]
  translate(en: String, key: String, tc: String): Locale
}

type ShareToken {
  id: ID!
  token: String!
  name: String
  scopes: JSON
  targetUrl: URL
}

type TokenUser {
  id: ID!
}

type Treatment {
  id: ID!
  type: String!
  added: DateTime!
  hiveId: ID!
  boxId: ID!
  familyId: ID!
}

input TreatmentOfBoxInput {
  hiveId: ID!
  boxId: ID!
  type: String!
}

input TreatmentOfHiveInput {
  hiveId: ID!
  type: String!
}

union UpdateUserResult = User | Error

scalar Upload

scalar URL

type User {
  id: ID!
  email: String
  first_name: String
  last_name: String

  # Language code: en, ru, tr, et, pl
  lang: String
  date_added: DateTime
  date_expiration: DateTime
  hasSubscription: Boolean
  isSubscriptionExpired: Boolean

  # Billing plan: free, base, pro
  billingPlan: String
}

type UserSession {
  key: String
  user: User
}

input UserUpdateInput {
  first_name: String
  last_name: String
  lang: String
}

union ValidateTokenResult = TokenUser | Error

type VideoSegment {
  id: ID!
  addTime: DateTime
  URL: URL
  filename: String
}

type VideoStream {
  id: ID!
  maxSegment: Int
  playlistURL: URL
  active: Boolean
  startTime: DateTime
  endTime: DateTime
}

`

export const schemaObject = buildSchema(schemaSDL)
