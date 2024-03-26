import {ExcelComponent} from '@core/ExcelComponent';

import {resize} from '@/components/table/resize';
import {isCell, matrix, shouldResize} from '@/components/table/table_helpers';
import {TableSelection} from '@/components/table/TableSelection';
import {$} from '@core/dom';
import {nextSelector} from '@core/utils';
// import * as actions from '@/redux/actions';
import {defaultStyles, rowsCount, CODES} from '../../constants';
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
        value: defaultStyles,
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
      } else if (event.ctrlKey) {
        this.selection.group.push($target)
        this.selection.selectGroup(this.selection.group)
      } else {
        this.selectCell($target)
      }
    } else if (event.target.closest('[data-type="resizable"]')) {
      const parent = event.target.closest('[data-type="resizable"]')
      let firstCell
      let lastCell
      if ($(parent).data.col) {
        const colId = $(parent).data.col 
        firstCell = {col: +colId, row: 0}
        lastCell = {col: +colId, row: rowsCount -1}
      } else if ($(parent).data.row) {
        const colsCount = CODES.Z - CODES.A + 1
        const rowId = $(parent).data.row
        firstCell = {col: 0, row: +rowId -1}
        lastCell = {col: colsCount-1, row: +rowId -1}
      } else return
      const $cells = matrix(lastCell, firstCell)
          .map(id => this.$root.find(`[data-id="${id}"]`))
      this.selection.selectGroup($cells)
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

    if (keys.includes(key)) {
      event.preventDefault()
      const id = this.selection.current.id(true)
      const $next = this.$root.find(nextSelector(key, id))
      if (event.shiftKey || event.ctrlKey) {
        this.selection.group.push($next)
        this.selection.selectGroup(this.selection.group)
        this.selection.current = $next
        $next.focus().addCssClass(TableSelection.className)
      } else {
        this.selectCell($next)
      }
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
    const data = {
      styles: JSON.stringify($(event.target)
          .getStyles(Object.keys(defaultStyles))),
      text: $(event.target).text(),
    }
    event.clipboardData.setData('text/plain', JSON.stringify(data));
  }

  onPaste(event) {
    event.preventDefault()
    const data = event.clipboardData.getData('text/plain');
    const {text, styles} = JSON.parse(data);
    this.selection.applyStyle(JSON.parse(styles))
    this.selection.current
        .attr('data-value', text)
        .text(text)
  }
}
