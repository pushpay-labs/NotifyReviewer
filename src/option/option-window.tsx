import * as React from 'react';
import { InputGroup, InputGroupAddon, InputGroupText, Input, Button, Label, Form, FormGroup, Table } from 'reactstrap';
import './styles.scss';
import { extensionName } from '../constants';

export interface FlagToListenTo {
	repoUrl: string;
	flag: string[];
	authors: string[];
	onlyToogleOn: boolean;
	frequency: number;
	isValid: boolean;
}

export interface OptionState {
	keepHistory: Boolean;
	autoCloseEnabled: Boolean;
	flags: FlagToListenTo[];
	history: string[];
}

export interface OptionStatePatch {
	keepHistory?: Boolean;
	autoCloseEnabled?: Boolean;
	flags?: FlagToListenTo[];
	history?: string[];
}

export function initState(savedflags): OptionState {
	return {
		flags: savedflags[extensionName] && savedflags[extensionName].flags || [],
		keepHistory: savedflags[extensionName] && savedflags[extensionName].keepHistory,
		history: savedflags[extensionName] && savedflags[extensionName].history || [],
		autoCloseEnabled: savedflags[extensionName] && savedflags[extensionName].autoCloseEnabled
	};
}

export default class OptionWindow extends React.Component {
	state = {
		keepHistory: false,
		autoCloseEnabled: false,
		flags: [],
		history: []
	} as OptionState;


	componentDidMount() {
		chrome.storage.sync.get(extensionName, (savedflags) => this.setState(initState(savedflags)));
	}

	setStateAndStoreData = (savedflags: any, newStatePatch: OptionStatePatch) => {
		const stateToStore = Object.assign({}, savedflags[extensionName], newStatePatch);
		chrome.storage.sync.set({ [extensionName]: stateToStore });
		this.setState(stateToStore);
		chrome.runtime.sendMessage({ refresh: true });
	}

	keepHistoryChange = () => {
		chrome.storage.sync.get(extensionName, (savedflags) => {
			this.setStateAndStoreData(savedflags, {
				keepHistory: !this.state.keepHistory,
			});
		});
	}

	UnRequireInput = () => {
		const author = document.getElementById('authorInput') as HTMLInputElement;
		const flag = document.getElementById('flagInput') as HTMLInputElement;
		flag.required = !author.value
		author.required = !flag.value
	}

	validateFlag = async (flag: FlagToListenTo) => {
		let globalResult = true;
		try {
			for (var i = 0, element; element = flag.flag[i]; i++) {
				await fetch(`${flag.repoUrl}/labels?q=${element}`)
					.then(
						(response) => {
							return response.text();
						})
					.then(
						(result) => {
							let parser = new DOMParser();
							let doc = parser.parseFromString(result, 'text/html');
							const labels = Array.prototype.slice.call(doc.querySelectorAll(`span.label-name`));
							if (!labels.some((label) => element === label.innerText)) {
								globalResult = false;
							}
						})
					.catch(() => {
						globalResult = false;
					});
			}
			return globalResult;

		} catch {
			return false;
		}
	}

	autoCloseChange = () => {
		chrome.storage.sync.get(extensionName, (savedflags) => {
			this.setStateAndStoreData(savedflags, {
				autoCloseEnabled: !this.state.autoCloseEnabled
			});
		});
	}

	handleSubmit = (event) => {
		event.preventDefault();
		let flags: string[];
		let authors: string[];
		let frequency: number;
		let repoUrl: string;
		let onlyToogleOn: boolean;

		frequency = event.target.elements.frequencyInput.value;
		flags = event.target.elements.flagInput.value.split(';').map(item => item.trim()).filter((e) => e);
		authors = event.target.elements.authorInput.value.split(';').map(item => item.trim()).filter((e) => e);
		repoUrl = event.target.elements.urlInput.value;
		onlyToogleOn = event.target.elements.onlyToogleOn.value !== 'Exclude';

		chrome.storage.sync.get(extensionName, async (savedflags) => {
			let items = savedflags[extensionName] && savedflags[extensionName].flags || [];
			let newFlag = {
				repoUrl: repoUrl,
				flag: flags,
				frequency: frequency,
				authors: authors,
				onlyToogleOn : onlyToogleOn
			} as FlagToListenTo;
			newFlag.isValid = await this.validateFlag(newFlag);
			console.log(newFlag.isValid);
			items.push(newFlag);

			this.setStateAndStoreData(savedflags, {
				flags: items
			});
			(document.getElementById('optionForm') as HTMLFormElement).reset();
		});
	}

	removeFlag = (indexToRemove: number) => {
		event.preventDefault();
		chrome.storage.sync.get(extensionName, (savedflags) => {
			let newarray = savedflags[extensionName] && savedflags[extensionName].flags || [];
			newarray.splice(indexToRemove, 1);

			this.setStateAndStoreData(savedflags, {
				flags: newarray,
				history: []
			});
		});
	}

	render() {
		return (
			<div id="optionContainer" className="option-container">
				<h5>Configuration</h5>
				<hr />
				<Form id="optionForm" onSubmit={this.handleSubmit} className="form-horizontal" >
					<FormGroup className="checkbox-form">
						<InputGroup>
							<Input onChange={this.keepHistoryChange} type="checkbox" id="keepHistory" checked={!!this.state.keepHistory} />
							<Label for="keepHistory">Keep pull request history after Chrome exits</Label>
						</InputGroup>
						<InputGroup>
							<Input onChange={this.autoCloseChange} type="checkbox" id="autoClose" checked={!!this.state.autoCloseEnabled} />
							<Label for="autoClose">Close notifications after 30 seconds</Label>
						</InputGroup>
					</FormGroup>
					<hr />
					<FormGroup>
						<InputGroup>
							<InputGroupAddon addonType="prepend">
								<InputGroupText id="repoUrl">Repository Url</InputGroupText>
							</InputGroupAddon>
							<Input id="urlInput" name="urlInput" type="text" placeholder="https://github.com/org/repo" aria-label="flags" aria-describedby="repoUrl" required />
						</InputGroup>
					</FormGroup>
					<FormGroup>
						<InputGroup>
							<InputGroupAddon addonType="prepend">
								<InputGroupText id="flagsaddon" >Label to listen to</InputGroupText>
							</InputGroupAddon>
							<Input id="flagInput" name="flagInput" type="text" placeholder="Ready For Review; Ready To Land" aria-label="flags" aria-describedby="flagsaddon" required
								onChange={this.UnRequireInput} />
						</InputGroup>
					</FormGroup>
					<FormGroup>
						<InputGroup>
							<InputGroupAddon addonType="prepend">
								<InputGroupText id="flagsaddon" >Author to listen to</InputGroupText>
							</InputGroupAddon>
							<Input id="authorInput" name="authorInput" type="text" placeholder="author1; author2" aria-label="flags" aria-describedby="authoraddon" required
								onChange={this.UnRequireInput} />
						</InputGroup>
					</FormGroup>
					<FormGroup>
						<InputGroup className="form-check-inline">
							<Input type="radio" name="onlyToogleOn" id="radioExclude" value="Exclude" defaultChecked />
							<Label for="radioExclude">
								Exclude Authors
							</Label>
							<Input type="radio" name="onlyToogleOn" id="radioOnly" value="Only" />
							<Label for="radioOnly">
								Only Authors
							</Label>
						</InputGroup>
					</FormGroup>
					<FormGroup>
						<InputGroup>
							<InputGroupAddon addonType="prepend">
								<InputGroupText id="frequency">Frequency(secs)</InputGroupText>
							</InputGroupAddon>
							<Input id="frequencyInput" name="frequencyInput" type="number" placeholder="e.g. 5" aria-label="flags" aria-describedby="frequencyInput" min="1" required />
						</InputGroup>
					</FormGroup>
					<FormGroup>
						<Button color="secondary" block outline type="submit" >Add</Button>
					</FormGroup>
					<br />
					<h5>Listeners</h5>
					<ul className="list-group list-group-flush list_sbar">
						<Table>
							<thead><tr><th>Repo</th><th>Flags</th><th>Authors</th><th>Freq(secs)</th><th></th></tr></thead>
							<tbody>{this.state.flags.map((flag, index) => {
								return <tr className={flag.isValid ? '' : 'table-danger'} key={index}>
									<td>{flag.repoUrl.replace('https://github.com/', '')}</td>
									<td>{flag.flag.join('; ')}</td>
									<td>{!flag.onlyToogleOn ? <s>{flag.authors.join('; ')}</s> : flag.authors.join('; ')}</td>
									<td>{flag.frequency}</td>
									<td>
										<Button type="button" className="close" aria-label="Close" onClick={() => this.removeFlag(index)}>
											<span aria-hidden="true">x</span>
										</Button>
									</td>
								</tr>;
							})}</tbody>
						</Table>
					</ul>
				</Form>
			</div>
		);
	}
}
