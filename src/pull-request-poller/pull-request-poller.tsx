import * as React from 'react';
import { extensionName } from '../constants';
import { initState, FlagToListenTo } from '../option/option-window';


export default class PullRequestPoller extends React.Component<FlagToListenTo, {}> {
	timer: NodeJS.Timer;
	props: FlagToListenTo;

	constructor(props: any, state: any) {
		super(props, state);
		this.props = props;
	}

	componentDidMount() {
		this.timer = setInterval(() =>
			fetch(`${this.props.repoUrl}/pulls?q=is%3Aopen+is%3Apr+${this.props.flag.map((value) => `label:"${value}"`).join('+')}`)
				.then((response) => {
					return response.text();
				})
				.then(
					async (result) => {
						chrome.storage.sync.get(extensionName, (savedflags) => {
							let state = initState(savedflags);
							if (savedflags[extensionName] && savedflags[extensionName].keepHistory) {
								state.history = savedflags[extensionName] && savedflags[extensionName].history || [];
							}
							let parser = new DOMParser();
							let doc = parser.parseFromString(result, 'text/html');
							const pullrequests = doc.querySelectorAll('a[id^=\'issue_\']');
							for (var i = 0, element; element = pullrequests[i]; i++) {
								let newPr = pullrequests[i].innerHTML;
								if (!state.history.some(x => x.length === newPr.length)) {
									var opt = {
										type: 'basic',
										title: `New pull request with flags ${this.props.flag.join(' and ')}`,
										message: newPr,
										iconUrl: 'logo.png',
										requireInteraction: true,
										priority: 2,
									};
									chrome.notifications.create(`${'https://github.com/' + pullrequests[i].getAttribute('href')}`, opt, (id) => {
										if (savedflags[extensionName] && savedflags[extensionName].autoCloseEnabled) {
											setTimeout(() => { chrome.notifications.clear(id); }, 30000);
										}
									});
									state.history.push(newPr);
									chrome.storage.sync.set({ [extensionName]: state });
								}
							}
						});
					},
					(error) => {
						this.setState({
							isLoaded: true,
							error
						});
					}
				)
			, this.props.frequency * 1000);
	}
	componentWillUnmount() {
		clearInterval(this.timer);
	}
	render() {
		return (
			<span className="timer" />
		);
	}
}
