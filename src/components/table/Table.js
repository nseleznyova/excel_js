import {ExcelComponent} from '@core/ExcelComponent';

import {resize} from '@/components/table/resize';
import {isCell, matrix, shouldResize} from '@/components/table/table_helpers';
import {TableSelection} from '@/components/table/TableSelection';
import {$} from '@core/dom';
import {nextSelector} from '@core/utils';
// import * as actions from '@/redux/actions';
import {defaultStyles} from '../../constants';
import * as actions from '../../redux/actions';
import {parse} from '../../core/parse';
import {createTable} from './table.template';


export class Table extends ExcelComponent {
  static className = 'excel__table'

  constructor($root, options) {
    super($root, {
      name: 'Table',
      listeners: ['mousedown', 'keydown', 'input', 'copy', 'paste'],
      ...options,
    });
  }

  prepare() {
    this.selection = new TableSelection()
  }

  toHTML() {
    return createTable(this.store.getState())
  }

  init() {
    super.init()

    const $cell = this.$root.find('[data-id="0:0"]')
    this.selectCell($cell)

    this.$on('formula:input', value => {
      this.selection.applyText(value)
      this.updateTextInStore(value)
    })

    this.$on('formula:done', () => {
      this.selection.current.focus()
    })

    this.$on('toolbar:applyStyle', value => {
      this.selection.applyStyle(value)
      const ids = this.selection.selectedIds
      this.$dispatch(actions.applyStyle({
        value,
        ids: ids,
      }))
    })

    this.$on('cell:deleteСontent', () => {
      this.selection.applyStyle(defaultStyles)
      const ids = this.selection.selectedIds
      this.$dispatch(actions.applyStyle({
        defaultStyles,
        ids: ids,
      }))
      this.updateTextInStore('')
      this.selection.applyText('')
    })
  }

  selectCell($cell) {
    // выделить ячейку и сообщить об этом наблюдателю
    this.selection.select($cell)
    this.$emit('table:select', $cell)
    const styles = $cell.getStyles(Object.keys(defaultStyles))
    this.$dispatch(actions.changeStyles(styles))
    this.$dispatch(actions.changeCurrentText($cell.data.value))
    console.log($cell.getStyles(Object.keys(defaultStyles)))
  }

  async resizeTable(event) {
    try {
      const data = await resize(this.$root, event)
      this.$dispatch(actions.tableResize(data))
    } catch (e) {
      console.warn('Resize error', e.message)
    }
  }

  onMousedown(event) {
    if (shouldResize(event)) {
      this.resizeTable(event)
    } else if (isCell(event)) {
      const $target = $(event.target)
      if (event.shiftKey) {
        const target = $target.id(true)
        const current = this.selection.current.id(true)
        const $cells = matrix(target, current)
            .map(id => this.$root.find(`[data-id="${id}"]`))
        this.selection.selectGroup($cells)
      } else {
        this.selectCell($target)
      }
    }
  }

  onKeydown(event) {
    const keys = [
      'Enter',
      'Tab',
      'ArrowLeft',
      'ArrowRight',
      'ArrowDown',
      'ArrowUp',
    ]

    const {key} = event

    if (keys.includes(key) && !event.shiftKey) {
      event.preventDefault()
      const id = this.selection.current.id(true)
      const $next = this.$root.find(nextSelector(key, id))
      this.selectCell($next)
    }
  }

  updateTextInStore(value) {
    this.$dispatch(actions.changeText({
      value,
      ids: this.selection.selectedIds,
    }))
  }

  onInput(event) {
    const value = $(event.target).text()
    this.selection.current
        .attr('data-value', value)
        .text(parse(value))
    this.updateTextInStore(value)
  }

  onCopy(event) {
    event.preventDefault()
    event.clipboardData.setData('text/plain', $(event.target).text());
  }

  onPaste(event) {
    event.clipboardData.getData('text/plain');
  }
}
