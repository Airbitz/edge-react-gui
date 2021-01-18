// @flow

import type { Disklet } from 'disklet'
import * as React from 'react'
import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from 'react-native'
import SortableListView from 'react-native-sortable-listview'
import { connect } from 'react-redux'

import { updateActiveWalletsOrder } from '../../actions/WalletListActions.js'
import XPubModal from '../../connectors/XPubModalConnector.js'
import s from '../../locales/strings.js'
import { getIsAccountBalanceVisible } from '../../modules/Settings/selectors.js'
import { getActiveWalletIds, getWalletLoadingPercent } from '../../modules/UI/selectors.js'
import { type Dispatch, type RootState } from '../../types/reduxTypes.js'
import { type GuiWallet } from '../../types/types.js'
import { getWalletListSlideTutorial, setUserTutorialList } from '../../util/tutorial.js'
import { CrossFade } from '../common/CrossFade.js'
import { SceneWrapper } from '../common/SceneWrapper.js'
import { WalletListSlidingTutorialModal } from '../modals/WalletListSlidingTutorialModal.js'
import { Airship } from '../services/AirshipInstance.js'
import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../services/ThemeContext.js'
import { EdgeText } from '../themed/EdgeText.js'
import { PasswordReminderModal } from '../themed/PasswordReminderModal.js'
import { WalletList } from '../themed/WalletList.js'
import { WalletListFooter } from '../themed/WalletListFooter.js'
import { WalletListHeader } from '../themed/WalletListHeader.js'
import { WalletListSortableRow } from '../themed/WalletListSortableRow.js'
import { WiredProgressBar } from '../themed/WiredProgressBar.js'

type StateProps = {
  activeWalletIds: string[],
  userId: string,
  wallets: { [walletId: string]: GuiWallet },
  disklet: Disklet,
  needsPasswordCheck: boolean
}

type DispatchProps = {
  updateActiveWalletsOrder(walletIds: string[]): void
}

type Props = StateProps & DispatchProps & ThemeProps

type State = {
  sorting: boolean,
  showSlidingTutorial: boolean,
  searching: boolean,
  searchText: string
}

class WalletListComponent extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      sorting: false,
      showSlidingTutorial: false,
      searching: false,
      searchText: ''
    }
  }

  showTutorial = async () => {
    const { disklet, userId } = this.props
    try {
      const userTutorialList = await getWalletListSlideTutorial(userId, disklet)
      const tutorialCount = userTutorialList.walletListSlideTutorialCount || 0

      if (tutorialCount < 2) {
        Airship.show(bridge => <WalletListSlidingTutorialModal bridge={bridge} />)
        this.setState({ showSlidingTutorial: true })
        userTutorialList.walletListSlideTutorialCount = tutorialCount + 1
        await setUserTutorialList(userTutorialList, disklet)
      }
    } catch (error) {
      console.log(error)
    }
  }

  componentDidMount() {
    if (this.props.needsPasswordCheck) {
      Airship.show(bridge => <PasswordReminderModal bridge={bridge} />)
    } else {
      this.showTutorial()
    }
  }

  handleToggleSorting = (sorting: boolean) => this.setState({ sorting })

  handleToggleWalletSearching = (searching: boolean) => this.setState({ searching })

  handleChangeSearchText = (searchText: string) => this.setState({ searchText })

  handleActivateSearch = () => this.setState({ searching: true })

  renderHeader = () => (
    <WalletListHeader
      sorting={this.state.sorting}
      searching={this.state.searching}
      toggleSorting={this.handleToggleSorting}
      onChangeSearchText={this.handleChangeSearchText}
      toggleWalletSearching={this.handleToggleWalletSearching}
    />
  )

  renderFooter = () => (this.state.searching ? null : <WalletListFooter />)

  render() {
    const { activeWalletIds, theme, wallets } = this.props
    const { showSlidingTutorial, searching, searchText, sorting } = this.state
    const styles = getStyles(theme)
    const loading = Object.keys(wallets).length <= 0

    return (
      <SceneWrapper>
        <WiredProgressBar progress={getWalletLoadingPercent} />
        {sorting && (
          <View style={styles.headerContainer}>
            <EdgeText style={styles.headerText}>{s.strings.title_wallets}</EdgeText>
            <TouchableOpacity key="doneButton" style={styles.headerButtonsContainer} onPress={this.disableSorting}>
              <EdgeText style={styles.doneButton}>{s.strings.string_done_cap}</EdgeText>
            </TouchableOpacity>
          </View>
        )}
        <View style={styles.listStack}>
          <CrossFade activeKey={loading ? 'spinner' : sorting ? 'sortList' : 'fullList'}>
            <ActivityIndicator key="spinner" color={theme.primaryText} style={styles.listSpinner} size="large" />
            <WalletList
              key="fullList"
              header={this.renderHeader}
              footer={this.renderFooter}
              searching={searching}
              searchText={searchText}
              activateSearch={this.handleActivateSearch}
              showSlidingTutorial={showSlidingTutorial}
            />
            <SortableListView
              key="sortList"
              style={StyleSheet.absoltueFill}
              data={wallets}
              order={activeWalletIds}
              onRowMoved={this.onActiveRowMoved}
              renderRow={this.renderSortableRow}
            />
          </CrossFade>
        </View>
        <XPubModal />
      </SceneWrapper>
    )
  }

  renderSortableRow = (guiWallet: GuiWallet | void) => {
    return <WalletListSortableRow guiWallet={guiWallet} showBalance={getIsAccountBalanceVisible} />
  }

  disableSorting = () => this.setState({ sorting: false })

  onActiveRowMoved = (action: { from: number, to: number }) => {
    const newOrder = [...this.props.activeWalletIds]
    newOrder.splice(action.to, 0, newOrder.splice(action.from, 1)[0])
    this.props.updateActiveWalletsOrder(newOrder)
    this.forceUpdate()
  }
}

const getStyles = cacheStyles((theme: Theme) => ({
  // The sort & add buttons are stacked on top of the header component:
  // Header Stack style
  headerContainer: {
    flexDirection: 'row',
    marginHorizontal: theme.rem(2)
  },
  headerText: {
    flex: 1
  },
  headerButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  doneButton: {
    color: theme.textLink
  },
  // The two lists are stacked vertically on top of each other:
  listStack: {
    flexGrow: 1
  },
  listSpinner: {
    flexGrow: 1,
    alignSelf: 'center'
  }
}))

export const WalletListScene = connect(
  (state: RootState): StateProps => {
    let activeWalletIds = getActiveWalletIds(state)

    // FIO disable changes below
    if (global.isFioDisabled) {
      const { currencyWallets = {} } = state.core.account
      activeWalletIds = activeWalletIds.filter(id => {
        const wallet = currencyWallets[id]
        return wallet == null || wallet.type !== 'wallet:fio'
      })
    }

    return {
      activeWalletIds,
      userId: state.core.account.id,
      wallets: state.ui.wallets.byId,
      disklet: state.core.disklet,
      needsPasswordCheck: state.ui.passwordReminder.needsPasswordCheck
    }
  },
  (dispatch: Dispatch): DispatchProps => ({
    updateActiveWalletsOrder(activeWalletIds) {
      dispatch(updateActiveWalletsOrder(activeWalletIds))
    }
  })
)(withTheme(WalletListComponent))
