import React, {Component} from 'react'
import {
  Clipboard,
  View,
  ToastAndroid,
  AlertIOS,
  Platform,
  Share
} from 'react-native'
import {connect} from 'react-redux'
import styles from './styles.js'
import ExchangeRate from '../../components/ExchangeRate/index.js'
import FlipInput from '../../components/FlipInput/index.js'
import ABQRCode from '../../components/QRCode/index.js'
import RequestStatus from '../../components/RequestStatus/index.js'
import ShareButtons from '../../components/ShareButtons/index.js'
import {getCryptoFromFiat, getFiatFromCrypto, sanitizeInput} from '../../../utils.js'
import ContactsWrapper from 'react-native-contacts-wrapper'
import LinearGradient from 'react-native-linear-gradient'

import * as CORE_SELECTORS from '../../../Core/selectors.js'
import * as UI_SELECTORS from '../../selectors.js'
import * as SETTINGS_SELECTORS from '../../Settings/selectors.js'

import {
  updateReceiveAddress,
  updateAmountRequestedInCrypto,
  updateAmountRequestedInFiat,
  saveReceiveAddress
} from './action.js'

import { ExchangedFlipInput } from './ExchangedFlipInput.js'

class Request extends Component {
  constructor (props) {
    super(props)
    this.state = {
      keyboardVisible: false,
      primaryAmount: 0,
      secondaryAmount: 0
    }
  }

  componentDidMount () {
    this.props.updateReceiveAddress(this.props.walletId, this.props.currencyCode)
  }
  _onFocus = () => this.setState({keyboardVisible: true})
  _onBlur = () => this.setState({keyboardVisible: false})

  onPrimaryAmountChange = (primaryDenominationAmount) => {
    console.log('onPrimaryAmountChange', primaryDenominationAmount)
  }

  onSecondaryAmountChange = (secondaryDenominationAmount) => {
    console.log('onSecondaryAmountChange', secondaryDenominationAmount)
  }

  render () {
    console.log('rendering Request.ui, this.state is: ', this.state, ' this.props is: ', this.props)
    const {request = {}} = this.props
    const {receiveAddress = {}} = request
    const {
      publicAddress = '',
      amountSatoshi = null,
      metadata = {}
    } = receiveAddress
    const { amountFiat = null } = metadata

    const primary = {
      amount: '0',
      displayCurrencyCode: this.props.currencyCode,
      exchangeCurrencyCode: this.props.currencyCode,
      denomination: this.props.primaryDenomination,
      onAmountChange: this.onPrimaryAmountChange
    }

    const secondary = {
      amount: '0',
      displayCurrencyCode: this.props.wallet.fiatCurrencyCode,
      exchangeCurrencyCode: this.props.wallet.isoFiatCurrencyCode,
      denomination: this.props.secondaryDenomination,
      onAmountChange: this.props.onSecondaryAmountChange
    }

    const color = 'white'

    return (
      <LinearGradient style={styles.view} start={{x: 0, y: 0}} end={{x: 1, y: 0}}
        colors={['#3b7adb', '#2b569a']}>

        <View style={styles.exchangeRateContainer}>
          <ExchangeRate
            fiatPerCrypto={this.props.fiatPerCrypto}
            fiatCurrencyCode={this.props.fiatCurrencyCode}
            cryptoDenomination={this.props.inputCurrencyDenomination} />
        </View>

        <View style={styles.main}>
          <ExchangedFlipInput
            currencyConverter={this.props.currencyConverter}
            primary={primary}
            secondary={secondary}
            color={color} />

          <ABQRCode qrCodeText={this.getQrCodeText(publicAddress, amountSatoshi)} />
          <RequestStatus requestAddress={publicAddress} amountRequestedInCrypto={amountSatoshi} amountReceivedInCrypto={amountFiat} />
        </View>

        <View style={styles.shareButtonsContainer}>
          <ShareButtons styles={styles.shareButtons} shareViaEmail={this.shareViaEmail} shareViaSMS={this.shareViaSMS} shareViaShare={this.shareViaShare} copyToClipboard={() => this.copyToClipboard(publicAddress, amountSatoshi)} />
        </View>

      </LinearGradient>
    )
  }

  // /////////////// Start Critical Input and Conversion Area //////////////////////
  onCryptoInputChange = (amountRequestedInCrypto) => {
    console.log('inside Request.ui->onCryptoInputChange, amountRequestedInCrypto is: ', amountRequestedInCrypto)
    amountRequestedInCrypto = sanitizeInput(amountRequestedInCrypto)
    if (this.invalidInput(amountRequestedInCrypto)) {
      return
    }
    const amountRequestedInFiat = getFiatFromCrypto(amountRequestedInCrypto, this.props.fiatPerCrypto)

    this.props.dispatch(updateAmountRequestedInCrypto(amountRequestedInCrypto))
    this.props.dispatch(updateAmountRequestedInFiat(amountRequestedInFiat))
  }

  onFiatInputChange = (amountRequestedInFiat) => {
    console.log('inside Request.ui->onCryptoInputChange, amountRequestedInCrypto is: ', amountRequestedInCrypto)
    amountRequestedInFiat = sanitizeInput(amountRequestedInFiat)
    if (this.invalidInput(amountRequestedInFiat)) {
      return
    }

    const amountRequestedInCrypto = getCryptoFromFiat(amountRequestedInFiat, this.props.fiatPerCrypto)
    this.props.dispatch(updateAmountRequestedInCrypto(amountRequestedInCrypto))
    this.props.dispatch(updateAmountRequestedInFiat(amountRequestedInFiat))
  }
  // /////////////// End Critical Input and Conversion Area //////////////////////
  copyToClipboard = (publicAddress, amountSatoshi) => {
    Clipboard.setString(this.getRequestInfoForClipboard(publicAddress, amountSatoshi))

    if (Platform.OS === 'android') { // needs internationalization and string replacement still
      ToastAndroid.show('Request copied to clipboard', ToastAndroid.SHORT)
    } else if (Platform.OS === 'ios') {
      AlertIOS.alert('Request copied to clipboard')
    }
  }

  getQrCodeText = (publicAddress, amountSatoshi) => {
    const qrCodeText = publicAddress

    return qrCodeText
  }

  getRequestInfoForClipboard = (publicAddress, amountSatoshi) => {
    const requestInfoForClipboard = publicAddress

    return requestInfoForClipboard
  }

  getRequestInfoForShare = (publicAddress, amountSatoshi) => {
    const requestInforForShare = publicAddress

    return requestInforForShare
  }

  invalidInput = (input) => {
    return (typeof parseInt(input) !== 'number' || isNaN(input))
  }

  showResult = (result) => {
    if (result.action === Share.sharedAction) {
      this.props.dispatch(saveReceiveAddress(this.props.request.receiveAddress))

      if (result.activityType) {
        this.setState({
          result: 'shared with an activityType: ' + result.activityType
        })
      } else {
        this.setState({result: 'shared'})
      }
    } else if (result.action === Share.dismissedAction) {
      this.setState({result: 'dismissed'})
    }
  }

  shareMessage = () => {
    Share.share({
      message: this.getRequestInfoForShare(),
      url: 'https://airbitz.co', // will need to refactor for white labeling
      title: 'Share Airbitz Request'
    }, {dialogTitle: 'Share Airbitz Request'}).then(this.showResult).catch((error) => this.setState({
      result: 'error: ' + error.message
    }))
  }

  shareViaEmail = () => {
    ContactsWrapper.getContact().then((contact) => {
      this.shareMessage()
      console.log('shareViaEmail')
    }).catch((error) => {
      console.log('ERROR CODE: ', error.code)
      console.log('ERROR MESSAGE: ', error.message)
    })
  }

  shareViaSMS = () => {
    ContactsWrapper.getContact().then((contact) => {
      this.shareMessage()
      console.log('shareViaSMS')
    }).catch((error) => {
      console.log('ERROR CODE: ', error.code)
      console.log('ERROR MESSAGE: ', error.message)
    })
  }

  shareViaShare = () => {
    this.shareMessage()
    console.log('shareViaShare')
  }
}

const mapStateToProps = (state) => {
  let exchangeRate = 0
  let primaryDenomination = {}
  let secondaryDenomination = {}
  const currencyConverter = CORE_SELECTORS.getCurrencyConverter(state)
  const wallet = UI_SELECTORS.getSelectedWallet(state)
  const currencyCode = UI_SELECTORS.getSelectedCurrencyCode(state)
  const defaultFiatDenomination = {
    name: 'Dollars',
    symbol: '$',
    multiplier: '100'
  }
  if (wallet) {
    const isoFiatCurrencyCode = wallet.isoFiatCurrencyCode
    exchangeRate = currencyConverter.convertCurrency(currencyCode, isoFiatCurrencyCode, 1)
    primaryDenomination = wallet.allDenominations[currencyCode]
    secondaryDenomination = wallet.allDenominations['fiat'] || defaultFiatDenomination
  }

  return {
    fiatPerCrypto: exchangeRate,
    request: state.ui.scenes.request,
    wallet,
    currencyCode,
    primaryDenomination,
    secondaryDenomination,
    currencyConverter
  }
}
const mapDispatchToProps = (dispatch) => ({
  updateReceiveAddress: (walletId, currencyCode) => {
    dispatch(updateReceiveAddress(walletId, currencyCode))
  }
})
export default connect(mapStateToProps, mapDispatchToProps)(Request)
