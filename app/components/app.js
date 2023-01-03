"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const preact_1 = require("preact");
const react_helmet_1 = __importDefault(require("react-helmet"));
const react_router_dom_1 = require("react-router-dom");
const urql_1 = require("urql");
const api_1 = require("./api");
const page_1 = __importDefault(require("./page"));
const menu_1 = __importDefault(require("./menu"));
const footer_1 = __importDefault(require("./footer"));
const paywall_1 = __importDefault(require("./paywall"));
const user_1 = require("./user");
class App extends preact_1.Component {
    render() {
        if (typeof window === 'undefined') {
            return;
        }
        return (<urql_1.Provider value={api_1.apiClient}>
				<react_helmet_1.default htmlAttributes={{ lang: 'en', amp: undefined }} // amp takes no value
         title="App" titleTemplate="Gratheon.com - %s" defaultTitle="Gratheon" titleAttributes={{ itemprop: 'name', lang: 'en' }} 
        // base={{ target: '_blank', href: 'https://app.gratheon.com/' }}
        meta={[
                {
                    name: 'description',
                    content: 'Swarm management application',
                },
                { property: 'og:type', content: 'article' },
            ]} link={[
                { rel: 'canonical', href: 'https://app.gratheon.com/' },
                // { rel: 'apple-touch-icon', href: 'http://mysite.com/img/apple-touch-icon-57x57.png' },
                // { rel: 'apple-touch-icon', sizes: '72x72', href: 'http://mysite.com/img/apple-touch-icon-72x72.png' }
            ]} script={[
            // { src: 'http://include.com/pathtojs.js', type: 'text/javascript' },
            // { type: 'application/ld+json', innerHTML: `{ "@context": "http://schema.org" }` }
            ]} noscript={[
            // { innerHTML: `<link rel="stylesheet" type="text/css" href="foo.css" />` }
            ]} style={[
            // { type: 'text/css', cssText: 'body {background-color: blue;} p {font-size: 12px;}' }
            ]}/>

				<div style="display:flex;flex-direction:column;">
					<react_router_dom_1.BrowserRouter>
						<menu_1.default path="*" isLoggedIn={(0, user_1.isLoggedIn)()}/>
						<paywall_1.default isLoggedIn={(0, user_1.isLoggedIn)()}/>
						<page_1.default />
						<footer_1.default />
					</react_router_dom_1.BrowserRouter>
				</div>
			</urql_1.Provider>);
    }
}
exports.default = App;
