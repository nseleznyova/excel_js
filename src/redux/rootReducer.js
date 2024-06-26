import {CHANGE_TEXT, CHANGE_CURRENT_TEXT, TABLE_RESIZE} from '@/redux/types';
import {APPLY_STYLE, CHANGE_STYLES, CHANGE_TITLE} from './types';


export function rootReducer(state, action) {
  let field
  let val
  switch (action.type) {
    case TABLE_RESIZE:
      field = action.data.resizerType === 'col' ? 'colState' : 'rowState'
      return {...state, [field]: value(state, field, action)} // col id, value
    case CHANGE_TEXT:
      field = 'dataState'
      val = state[field] || {}
      action.data.ids.forEach(id => {
        val[id] = action.data.value
      })
      return {
        ...state,
        [field]: val,
        currentText: action.data.value,
      }
    case CHANGE_CURRENT_TEXT:
      return {...state, currentText: action.data}
    case CHANGE_STYLES:
      return {...state, currentStyles: action.data}
    case APPLY_STYLE:
      field = 'stylesState'
      val = state[field] || {}
      action.data.ids.forEach(id => {
        val[id] = {...val[id], ...action.data.value}
      })
      return {
        ...state,
        [field]: val,
        currentStyles: {...state.currentStyles, ...action.data.value},
      }
    case CHANGE_TITLE:
      return {...state, title: action.data}
    default: return state
  }
}


function value(state, field, action) {
  const val = state[field] || {}
  val[action.data.id] = action.data.value
  return val
}
