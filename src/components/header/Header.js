import {ExcelComponent} from '@core/ExcelComponent';
import {$} from '../../core/dom';
import {changeTitle} from '../../redux/actions';
import {defaultTitle} from '../../constants';

export class Header extends ExcelComponent {
  static className = 'excel__header'

  constructor($root, options) {
    super($root, {
      name: 'Header',
      listeners: ['input', 'click'],
      ...options,
    });
  }
  toHTML() {
    const title = this.store.getState().title || defaultTitle
    return `
      <input type="text" class="input" value="${title}"/>

        <div>

            <div class="button">
                <i class="material-icons" data-button="delete">delete</i>
            </div>
            <div class="button">
                <i class="material-icons">exit_to_app</i>
            </div>

        </div>
    `
  }

  onInput(event) {
    const $target = $(event.target)
    this.$dispatch(changeTitle($target.text()))
  }

  onClick(event) {
    if ($(event.target).data.button === 'delete') {
      this.$emit('cell:deleteСontent');
    }
  }
}
