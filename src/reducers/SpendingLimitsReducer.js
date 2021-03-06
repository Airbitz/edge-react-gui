// @flow

import { combineReducers } from 'redux'

import { type Action } from '../types/reduxTypes.js'

// REDUCERS
export const initialState = {
  transaction: {
    isEnabled: false,
    amount: 0
  }
}

export const isEnabled = (state: boolean = initialState.transaction.isEnabled, action: Action) => {
  switch (action.type) {
    case 'ACCOUNT_INIT_COMPLETE':
    case 'SPENDING_LIMITS/NEW_SPENDING_LIMITS': {
      return action.data.spendingLimits.transaction.isEnabled
    }
    default:
      return state
  }
}

export const amount = (state: number = initialState.transaction.amount, action: Action) => {
  switch (action.type) {
    case 'ACCOUNT_INIT_COMPLETE':
    case 'SPENDING_LIMITS/NEW_SPENDING_LIMITS': {
      return action.data.spendingLimits.transaction.amount
    }
    default:
      return state
  }
}

export const transaction = combineReducers({
  isEnabled,
  amount
})

export const spendingLimits = combineReducers({
  transaction
})
