import {toInlineStyles} from '../../core/utils';
import {defaultStyles, rowsCount, CODES} from '../../constants';
import {parse} from '../../core/parse';

const DEFAULT_WIDTH = '125px'
const DEFAULT_HEIGHT = '24px'

function getWidth(colState, index) {
  return (colState[index] || DEFAULT_WIDTH)
}

function getHeight(rowState, index) {
  return (rowState[index] || DEFAULT_HEIGHT)
}

function withWidthFrom(state) {
  return function(col, index) {
    return {
      col, index, width: getWidth(state.colState, index),
    }
  }
}

function toCell(state, row) {
  return function(_, col) {
    const id = `${row}:${col}`
    const width = getWidth(state.colState, col)
    const data = state.dataState[id] || ''
    const styles = toInlineStyles({
      ...defaultStyles,
      ...state.stylesState[id] || '',
    })
    return `
        <div 
          class="cell" 
          contenteditable
          data-type="cell"
          data-col="${col}"
          data-id="${id}"
          data-value="${data || ''}"
          style="${styles}; width: ${width}"
        >${parse(data) || ''}</div>
    `
  }
}

function toColumn({col, index, width}) {
  return `
    <div 
      class="column" 
      data-type="resizable" 
      data-col="${index}" 
      style="width: ${width}"
    >
        ${col}
        <div class="col-resize" data-resize="col"></div>
    </div>
  `
}

function createRow(index, content, rowState) {
  const height = getHeight(rowState, index)
  const resize = '<div class="row-resize" data-resize="row"></div>'
  return `
    <div 
      class="row" 
      data-type="resizable" 
      data-row="${index}" 
      style="height: ${height}"
    >
        <div class="row-info">
            ${index? index : ''}
            ${index? resize : ''}
        </div>
        <div class="row-data">${content}</div>
    </div>
  `
}

function toChar(_, index) {
  return String.fromCharCode(CODES.A + index)
}

export function createTable(state = {}) {
  const colsCount = CODES.Z - CODES.A + 1
  const rows = []
  
  const cols = new Array(colsCount)
      .fill('')
      .map(toChar)// el, index
      .map(withWidthFrom(state))
      .map(toColumn)
      .join('')

  rows.push(createRow(null, cols, {}))

  for (let row = 0; row < rowsCount; row++) {
    const cells = new Array(colsCount)
        .fill('')
        .map(toCell(state, row))
        .join('')
    rows.push(createRow(row + 1, cells, state.rowState))
  }

  return rows.join('')
}
