import * as React from 'react';
import PullRequestPoller from '../pull-request-poller/pull-request-poller';
import { extensionName } from '../constants';
import { FlagToListenTo } from '../option/option-window';

export default class BackgroundWindow extends React.Component {
	state = { data: [] };

	componentDidMount() {
		chrome.runtime.onMessage.addListener((request) => {
			if (request.refresh) {
				this.loadData();
			}
		});

		this.loadData();
		chrome.notifications.onClicked.addListener((notificationId) => {
			chrome.tabs.create({ url: notificationId });
			chrome.notifications.clear(notificationId);
		});
	}

	render() {
		return (<div id="pollerContainer">
			{this.state.data}
		</div>
		);
	}

	loadData = () => {
		let table = [];
		let items: FlagToListenTo[];
		chrome.storage.sync.get(extensionName, (savedflags) => {
			items = savedflags[extensionName] && savedflags[extensionName].flags || [];
			items.forEach((value) => {
				table.push(<PullRequestPoller key={Math.random().toString()} {...value} />);
			});
			this.setState({ data: table });
		});
	}
}
