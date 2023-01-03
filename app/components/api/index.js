"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.gql = exports.useSubscription = exports.useMutation = exports.useQuery = exports.useUploadMutation = exports.apiClient = exports.graphqlWsClient = exports.omitTypeName = exports.lastGraphQLErrors = exports.lastNetworkError = void 0;
const graphql_ws_1 = require("graphql-ws");
const urql_1 = require("urql");
Object.defineProperty(exports, "gql", { enumerable: true, get: function () { return urql_1.gql; } });
const exchange_multipart_fetch_1 = require("@urql/exchange-multipart-fetch");
const user_1 = require("../user");
const uri_1 = require("../uri");
const schema_1 = require("./schema");
const offlineIndexDbExchange_1 = require("./offlineIndexDbExchange");
const db_1 = require("./db");
const resolvers_1 = __importDefault(require("./resolvers"));
let uri = (0, uri_1.gatewayUri)();
if (!(0, user_1.isLoggedIn)()) {
    if (typeof window !== 'undefined') {
        if (!window.location.pathname.match('/account')) {
            window.location.href = (0, uri_1.getAppUri)() + '/account/authenticate/';
        }
    }
}
let lastNetworkError = null;
exports.lastNetworkError = lastNetworkError;
let lastGraphQLErrors = [];
exports.lastGraphQLErrors = lastGraphQLErrors;
const graphqlWsClient = (0, graphql_ws_1.createClient)({
    url: 'ws://localhost:8350/graphql',
    keepAlive: 5_000,
    lazy: false,
    shouldRetry: () => true,
    connectionParams: {
        token: (0, user_1.getToken)(),
    },
});
exports.graphqlWsClient = graphqlWsClient;
// create index db schema out of graphql schema
(0, db_1.syncGraphqlSchemaToIndexDB)(schema_1.schemaObject);
const apiClient = (0, urql_1.createClient)({
    url: uri,
    exchanges: [
        urql_1.dedupExchange,
        //@ts-ignore
        (0, offlineIndexDbExchange_1.offlineIndexDbExchange)({
            cacheFirst: false,
            schemaObject: schema_1.schemaObject,
            resolvers: resolvers_1.default,
            writeHooks: db_1.writeHooks,
        }),
        (0, urql_1.subscriptionExchange)({
            forwardSubscription: (operation) => ({
                subscribe: (sink) => ({
                    unsubscribe: graphqlWsClient.subscribe(operation, sink),
                }),
            }),
        }),
        exchange_multipart_fetch_1.multipartFetchExchange,
    ],
    fetchOptions: () => {
        return {
            headers: { token: (0, user_1.getToken)() },
        };
    },
});
exports.apiClient = apiClient;
function omitTypeName(obj) {
    return JSON.parse(JSON.stringify(obj), (key, v) => key === '__typename' ? undefined : v);
}
exports.omitTypeName = omitTypeName;
function useMutationAdapted(query, variables) {
    //@ts-ignore
    const [result, op] = (0, urql_1.useMutation)(query, variables);
    //@ts-ignore
    return [op, result];
}
exports.useMutation = useMutationAdapted;
function useUploadMutation(query) {
    const [result, op] = (0, urql_1.useMutation)(query);
    function opWrap(payload) {
        return op(payload, {
            url: (0, uri_1.uploadUri)(),
        });
    }
    return [opWrap, result];
}
exports.useUploadMutation = useUploadMutation;
function useQueryAdapted(query, options) {
    const [result] = (0, urql_1.useQuery)({
        query,
        variables: options?.variables,
    });
    return {
        data: result.data,
        loading: result.fetching,
        error: result.error,
    };
}
exports.useQuery = useQueryAdapted;
function useSubscriptionAdapted(query, variables) {
    const [result] = (0, urql_1.useSubscription)({ query, variables });
    return result;
}
exports.useSubscription = useSubscriptionAdapted;
