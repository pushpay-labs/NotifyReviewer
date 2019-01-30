import 'bootstrap';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import OptionWindow from './option-window';

chrome.tabs.query({ active: true, currentWindow: true }, () => {
	ReactDOM.render(<OptionWindow />, document.getElementById('ReactContainer'));
});
