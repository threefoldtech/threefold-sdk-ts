from utils.utils import generate_leters, generate_string, get_email, get_seed, valid_amount, invalid_address, invalid_amount, invalid_amount_negtive
from pages.transfer import TransferPage
from pages.dashboard import DashboardPage

#  Time required for the run (10 cases) is approximately 2 minutes.

def before_test_setup(browser):
    transfer_page = TransferPage(browser)
    dashboard_page = DashboardPage(browser)
    password = generate_string()
    dashboard_page.open_and_load()
    dashboard_page.import_account(get_seed())
    dashboard_page.click_button(dashboard_page.connect_your_wallet(get_email(), password))
    transfer_page.navigate()
    return transfer_page

def test_transfer_page(browser):
    """
      Test Case: TC982 - Navigate to transfer
      Steps:
          - Navigate to the dashboard.
          - Login.
          - Click on Transfer from side menu.
      Result: User should be navigated to Transfer page.
    """
    before_test_setup(browser)
    assert 'Transfer TFTs on the TFChain' in browser.page_source


def test_valid_address(browser):
    """
    Test Case: TC984 - Valid Address Receipient
      Steps:
          - Navigate to the dashboard.
          - Login.
          - Click on Transfer from side menu.
          - Type valid address in recipient input.
      Results: Accepting address with no alerts
    """
    transfer_page = before_test_setup(browser)
    transfer_page.by_twin_address()
    transfer_page.amount_tft_input(valid_amount())
    transfer_page.recipient_input('5FWW1F7XHaiRgPEqJdkv9nVgz94AVKXkTKNyfbLcY4rqpaNM')
    assert transfer_page.wait_for_button(transfer_page.get_address_submit()).is_enabled() == True


def test_invalid_address(browser):
    """
    Test Case: TC985 - Invalid Address
    Steps:
        - Navigate to the dashboard.
        - Login.
        - Click on Transfer from side menu.
        - Type invalid address in recipient input.
    Results: Alert message "invalid address" and "Cannot transfer to yourself"
    """
    transfer_page = before_test_setup(browser)
    twin_address = transfer_page.get_twin_address()
    transfer_page.by_twin_address()
    transfer_page.amount_tft_input(valid_amount())
    transfer_page.recipient_input(twin_address)
    assert transfer_page.wait_for('Cannot transfer to yourself')
    assert transfer_page.get_address_submit().is_enabled() == False
    cases = [' ', generate_string(), invalid_address(), generate_leters()]
    for case in cases:
      transfer_page.recipient_input(case)
      assert transfer_page.wait_for('Invalid Address')
      assert transfer_page.get_address_submit().is_enabled() == False


def test_twin_id(browser):
    """
    Test Case: TC1918 - Recipient twin ID input validation
    Steps:
        - Navigate to the dashboard.
        - Login.
        - Click on Transfer from side menu.
        - Select by twin id
        - Type twin id in recipient input.
    Results: Alert message if wrong, else Accepting twin id with no alerts
    """
    transfer_page = before_test_setup(browser)
    twin_id = transfer_page.get_twin_id()
    transfer_page.amount_tft_id_input(valid_amount())
    transfer_page.recipient_id_input(twin_id)
    assert transfer_page.wait_for('Cannot transfer to yourself')
    assert transfer_page.get_id_submit().is_enabled() == False
    transfer_page.recipient_id_input(999999999)
    assert transfer_page.wait_for('This twin id doesn')
    assert transfer_page.get_id_submit().is_enabled() == False
    cases = [' ', generate_string(), invalid_address(), generate_leters()]
    for case in cases:
      transfer_page.recipient_id_input(case)
      assert transfer_page.wait_for('Twin ID should be a valid integer')
      assert transfer_page.get_id_submit().is_enabled() == False
    cases = ['0', '-52']
    for case in cases:
      transfer_page.recipient_id_input(case)
      assert transfer_page.wait_for('Twin ID should be greater than zero')
      assert transfer_page.get_id_submit().is_enabled() == False


def test_valid_amount(browser):
    """
    Test Case: TC986 - Valid amount
    Steps:
        - Navigate to the dashboard.
        - Login.
        - Click on Transfer from side menu.
        - Type valid amount in TFT input.
    Result: User gets no alerts
    """
    transfer_page = before_test_setup(browser)
    transfer_page.by_twin_address()
    transfer_page.amount_tft_input(valid_amount())
    transfer_page.recipient_input('5FWW1F7XHaiRgPEqJdkv9nVgz94AVKXkTKNyfbLcY4rqpaNM')
    assert transfer_page.wait_for_button(transfer_page.get_address_submit()).is_enabled() == True


def test_invalid_amount(browser):
    """
    Test Case: TC987 - InValid amount
    Steps:
        - Navigate to the dashboard.
        - Login.
        - Click on Transfer from side menu.
        - Type Invalid amount in TFT input.
    Result: Alert with message "Amount cannot be negative or 0"
    """
    transfer_page = before_test_setup(browser)
    transfer_page.by_twin_address()
    transfer_page.amount_tft_input(2)
    transfer_page.recipient_input('5FWW1F7XHaiRgPEqJdkv9nVgz94AVKXkTKNyfbLcY4rqpaNM')
    balance = transfer_page.get_balance()
    cases = ['-900.009', invalid_amount_negtive()]
    for case in cases:
      transfer_page.amount_tft_input(case)
      assert transfer_page.wait_for('Amount must be greater than 0')
      assert transfer_page.get_address_submit().is_enabled() == False
    cases = ['0', ' ']
    for case in cases:
      transfer_page.amount_tft_input(case)
      assert transfer_page.wait_for('Transfer amount is required')
      assert transfer_page.get_address_submit().is_enabled() == False
    transfer_page.amount_tft_input(invalid_amount())
    assert transfer_page.wait_for('Amount can have 3 decimals only.')
    assert transfer_page.get_address_submit().is_enabled() == False
    transfer_page.amount_tft_input(format(float(balance)+100,'.3f'))
    assert transfer_page.wait_for('Insufficient funds')
    assert transfer_page.get_address_submit().is_enabled() == False


def test_transfer_tfts_on_tfchain_by_twin_address(browser):
    """
    Test Case: TC988 - Transfer TFTs on the TFChain
    Steps:
        - Navigate to the dashboard.
        - Login.
        - Click on Transfer from side menu.
        - Type valid address in recipient input.
        - Type valid amount in TFT input.
        - Click submit button.
    Result: Amount should dedicate from this account twin and transferred to the typed address.
    """
    transfer_page = before_test_setup(browser)
    transfer_page.by_twin_address()
    balance = transfer_page.get_balance()
    min_balance = float(balance)-1
    max_balance = float(balance)-1.1
    transfer_page.amount_tft_input(1.01)
    transfer_page.recipient_input('5FWW1F7XHaiRgPEqJdkv9nVgz94AVKXkTKNyfbLcY4rqpaNM')
    transfer_page.wait_for_button(transfer_page.get_address_submit()).click()
    assert transfer_page.wait_for('Transaction Complete!')
    assert format(float(max_balance),'.3f') <= format(float(transfer_page.get_balance_transfer(balance)),'.3f') <= format(float(min_balance),'.3f')


def test_transfer_tfts_on_tfchain_by_twin_id(browser):
    """
    Test Case: TC1917 - Transfer TFTs on the TFChain by ID
    Steps:
        - Navigate to the dashboard.
        - Login.
        - Click on Transfer from side menu.
        - Type valid id in recipient input.
        - Type valid amount in TFT input.
        - Click submit button.
    Result: Amount should dedicate from this account twin and transferred to the typed id.
    """
    transfer_page = before_test_setup(browser)
    balance = transfer_page.get_balance()
    min_balance = float(balance)-1
    max_balance = float(balance)-1.1
    transfer_page.recipient_id_input('162')
    transfer_page.amount_tft_id_input(1.01)
    transfer_page.wait_for_button(transfer_page.get_id_submit()).click()
    assert transfer_page.wait_for('Transaction Complete!')
    assert format(float(max_balance),'.3f') <= format(float(transfer_page.get_balance_transfer(balance)),'.3f') <= format(float(min_balance),'.3f')