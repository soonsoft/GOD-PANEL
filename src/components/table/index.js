import { LitElement, html, css } from 'lit';
import styles from './style.css?inline';

class TableView extends LitElement {
    static styles = css`${styles}`;

    static properties = {
        viewData: { type: Array },
        columns: { type: Array },
    };

}

export default TableView;