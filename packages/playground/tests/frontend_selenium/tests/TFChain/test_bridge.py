from utils.utils import generate_leters, generate_string, get_email, get_seed, get_stellar_address
from pages.dashboard import DashboardPage
from utils.grid_proxy import GridProxy
from pages.bridge import BridgePage
import pytest

#  Time required for the run (11 cases) is approximately 3 minutes.


def before_test_setup(browser):
    bridge_page = BridgePage(browser)
    dashboard_page = DashboardPage(browser)
    password = generate_string()
    dashboard_page.open_and_load()
    dashboard_page.import_account(get_seed())
    dashboard_page.click_button(dashboard_page.connect_your_wallet(get_email(), password))
    bridge_page.navigate_to_bridge()
    return bridge_page

def test_navigate_bridge(browser):
    """
      Test Case: TC1112 Navigate bridge
      Steps:
          - Navigate to the dashboard.
          - Login.
          - Click on bridge from side menu.
      Result: bridge page open.
    """
    before_test_setup(browser)
    assert 'Transfer TFT Across Chains' in browser.page_source


# def test_transfer_chain(browser):
#     """
#       Test Case: TC1113 transfer chain
#       Steps:
#           - Navigate to the dashboard.
#           - Login.
#           - Click on bridge from side menu.
#           - Click on chain list.
#       Result: Steller should be selected.
#     """
#     bridge_page = before_test_setup(browser)
#     bridge_page.transfer_chain()
#     assert 'stellar' in browser.page_source


def test_choose_deposit(browser):
    """
      Test Case: TC1114 choose deposit
      Steps:
          - Navigate to the dashboard.
          - Login.
          - Click on bridge from side menu.
          - Click on chain list.
          - Click on deposit button.
          - Click on close button.
      Result: Deposit tft will be shown.
    """
    bridge_page = before_test_setup(browser)
    bridge_page.choose_deposit()
    assert 'Deposit TFT' in browser.page_source


def test_choose_withdraw(browser):
    """
      Test Case: TC1115 choose withdraw
      Steps:
          - Navigate to the dashboard.
          - Login.
          - Click on bridge from side menu.
          - Click on chain list.
          - Click on withdraw button.
          - Click on close button.
      Result: withdraw tft will be shown.
    """
    bridge_page = before_test_setup(browser)
    bridge_page.choose_withdraw()
    assert 'Withdraw TFT' in browser.page_source


def test_how_it_done(browser):
    """
      Test Case: TC1116 how it done
      Steps:
          - Navigate to the dashboard.
          - Login.
          - Click on bridge from side menu.
          - Click on how it's done text.
      Result: it will go to link
    """
    bridge_page = before_test_setup(browser)
    assert bridge_page.how_it_done() in 'https://www.manual.grid.tf/documentation/threefold_token/tft_bridges/tfchain_stellar_bridge.html'
    assert bridge_page.deposite_learn_more() in 'https://www.manual.grid.tf/documentation/threefold_token/tft_bridges/tft_bridges.html'


def test_check_deposit(browser):
    """
      Test Case: TC1117 check deposit
      Steps:
          - Navigate to the dashboard.
          - Login.
          - Click on bridge from side menu.
          - Click on chain list.
          - Click on deposit button.
          - Click on close button.
      Result: Assert that Destination and memo text will come from drid proxy.
    """
    bridge_page = before_test_setup(browser)
    grid_proxy = GridProxy(browser)
    twin_id, amount_text, bridge_address = bridge_page.check_deposit()
    assert bridge_page.wait_for(amount_text)
    assert bridge_address == 'GDHJP6TF3UXYXTNEZ2P36J5FH7W4BJJQ4AYYAXC66I2Q2AH5B6O6BCFG'
    assert bridge_page.wait_for('Add twin ID as memo text or you will lose your tokens')
    user_address = bridge_page.twin_address()
    assert grid_proxy.get_twin_address(twin_id[twin_id.find('_')+1:]) == user_address


@pytest.mark.skip(reason="https://github.com/threefoldtech/tfgrid-sdk-ts/issues/3752")
def test_check_withdraw_stellar(browser):
    """
      Test Case: TC1118 check withdraw stellar
      Steps:
          - Navigate to the dashboard.
          - Login.
          - Click on bridge from side menu.
          - Click on chain list.
          - Click on withdraw button.
          - Put stellar Address.
          - Click on close button.
      Result: Assert that stellar address is right.
    """
    bridge_page = before_test_setup(browser)
    assert bridge_page.check_withdraw(get_stellar_address(), '2.01').is_enabled() == True


def test_check_withdraw_invalid_stellar(browser):
    """
      Test Case: TC1143 - Check withdraw invalid Stellar address
      Steps:
          - Navigate to the dashboard.
          - Login.
          - Click on bridge from side menu.
          - Click on chain list.
          - Click on withdraw button.
          - Put stellar Address.
          - Click on close button.
      Result: Alert with message "invalid address" should be displayed.
    """
    bridge_page = before_test_setup(browser)
    bridge_page.setup_withdraw_tft(3)
    cases = [' ', generate_string(), generate_leters(), '!@##$%$E^/>|ز%^(;:^*)']
    for case in cases:
        assert bridge_page.check_withdraw_invalid_stellar(case) == False
        assert bridge_page.wait_for('Invalid address')
    assert bridge_page.check_withdraw_invalid_stellar('GDNEFLS7YFBER7Z53N7DGR5OYEOEHBSKNW6KDIEK7PAQ4PNMUUONI6VS') == False
    assert bridge_page.wait_for('Address not found')
    assert bridge_page.check_withdraw_invalid_stellar('') == False
    assert bridge_page.wait_for('This field is required')

@pytest.mark.skip(reason="https://github.com/threefoldtech/tfgrid-sdk-ts/issues/3752")
def test_check_withdraw_tft_amount(browser):
    """
      Test Case: TC1131 check withdraw tft amount
      Steps:
          - Navigate to the dashboard.
          - Login.
          - Click on bridge from side menu.
          - Click on chain list.
          - Click on withdraw button.
          - Put amount of tft you want to send.
          - Click on close button.
      Result: Assert that the amount of tft is right.
    """
    bridge_page = before_test_setup(browser)
    balance = bridge_page.setup_widthdraw_address(get_stellar_address())
    cases = [2, 8.001, 10.111]
    cases.append(format(float(balance)-1, '.3f'))
    for case in cases:
        assert bridge_page.check_withdraw_tft_amount(case) == True


def test_check_withdraw_invalid_tft_amount(browser):
    """
      Test Case: TC1144 - Check withdraw invalid TFT amount
      Steps:
          - Navigate to the dashboard.
          - Login.
          - Click on bridge from side menu.
          - Click on chain list.
          - Click on withdraw button.
          - Put amount of tft you want to send.
          - Click on close button.
      Result: Alert with message "Amount cannot be negative or 0" should be displayed.
    """
    bridge_page = before_test_setup(browser)
    balance = bridge_page.setup_widthdraw_address(get_stellar_address())
    cases = [0, 0.000, 0.0, -0.1, -1, -22.2, -1.111, 0.123, 1.999]
    for case in cases:
        assert bridge_page.check_withdraw_invalid_tft_amount(case) == False
        assert bridge_page.wait_for('Amount should be at least 2 TFT')
    assert bridge_page.check_withdraw_invalid_tft_amount('2.0123') == False
    assert bridge_page.wait_for('Amount must have 3 decimals only')
    assert bridge_page.check_withdraw_invalid_tft_amount(format(float(balance)+100, '.3f')) == False
    assert bridge_page.wait_for('Amount cannot exceed balance')
    assert bridge_page.check_withdraw_invalid_tft_amount('') == False
    assert bridge_page.wait_for('This field is required')

@pytest.mark.skip(reason="https://github.com/threefoldtech/tfgrid-sdk-ts/issues/3752")
def test_check_withdraw(browser):
    """
      Test Case: TC1132 check withdraw 
      Steps:
          - Navigate to the dashboard.
          - Login.
          - Click on bridge from side menu.
          - Click on chain list.
          - Click on withdraw button.
          - Put stellar Address.
          - Put amount of tft you want to send.
          - Click on close button.
      Result: Assert that Amount of tft should send to the stellar.
    """
    bridge_page = before_test_setup(browser)
    balance = bridge_page.get_balance()
    min_balance = float(balance)-2
    max_balance = float(balance)-2.11
    bridge_page.check_withdraw(get_stellar_address(), '2.1').click()
    assert bridge_page.wait_for('Transaction Succeeded')
    assert format(float(max_balance), '.3f') <= format(float(bridge_page.get_balance_withdraw(balance)), '.3f') <= format(float(min_balance), '.3f')
