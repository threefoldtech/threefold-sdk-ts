from utils.utils import get_email, generate_email, generate_string, get_seed
from pages.twin import TwinPage
from utils.grid_proxy import GridProxy
from pages.dashboard import DashboardPage

#  Time required for the run (6 cases) is approximately 3 minutes.


def before_test_setup(browser):
    twin_page = TwinPage(browser)
    dashboard_page = DashboardPage(browser)
    password = generate_string()
    dashboard_page.open_and_load()
    dashboard_page.import_account(get_seed())
    dashboard_page.click_button(dashboard_page.connect_your_wallet(get_email(), password))
    twin_page.navigate()
    return twin_page


def test_twin_details(browser):
    """
      Test Cases: TC1867 - Twin details
      Steps:
          - Navigate to dashboard
          - Login.
      Result: Assert twin details with the grid proxy.
    """
    twin_page = before_test_setup(browser)
    grid_proxy = GridProxy(browser)
    twin_id, twin_email, twin_address, twin_relay = twin_page.get_twin_details()
    assert twin_address == grid_proxy.get_twin_address(twin_id)
    assert twin_relay == grid_proxy.get_twin_relay(twin_id)
    assert twin_email == get_email()


def test_edit_twin_email(browser):
    """
      Test Cases: TC925- edit twin email
      Steps:
          - Navigate to dashboard.
          - Enter Mnemonics, Password and Confirmation password.
          - Click on Connect.
          - Navigate to Your Profile page.
          - Click on edit button.
          - type in the new email.
          - Click on submit button.
      Result: Assert that twin relay edited.
    """
    twin_page = before_test_setup(browser)
    email = generate_email()
    assert twin_page.press_edit_btn() == get_email()
    twin_page.edit_twin_email(email)
    cases = [generate_string(), '123456', '!)$%&@#(+?', '1@c@vva.ca', '1f@test,com', '@test.com', 'test@.com', 'test@com']
    for case in cases:
        twin_page.edit_twin_email(case)
        assert twin_page.wait_for('Please provide a valid email address')
    twin_page.edit_twin_email('')
    assert twin_page.wait_for('Email is required')
    twin_page.edit_twin_email(email)
    twin_page.press_submit_btn()
    assert twin_page.wait_for(email)


def test_get_tft(browser):
    """
      Test Cases: TC933- Get TFT 
      Steps:
          - Navigate to dashboard
          - Login.
          - Check Get TFT right to TFT price on the top right corner.
          - Click on the Get TFT button.
          - Press on locked TFT info button
      Result: Assert that it should go to the correct link. 
    """
    twin_page = before_test_setup(browser)
    # twin_page.get_tft() # Get TFT button was removed from dashboard
    # assert '/html' in browser.page_source
    # NO checking as devnet don't direct to TF Connect page https://gettft.com/auth/login?next_url=/gettft/shop/#/buy
    assert twin_page.press_locked_info() == 'https://www.manual.grid.tf/documentation/developers/tfchain/tfchain.html#contract-locking'

@pytest.mark.skip(reason="https://github.com/threefoldtech/tfgrid-sdk-ts/issues/3751")
def test_twin_links(browser):
    """
      Test Case: TC1801 - Verify your profile links
      Steps:
          - Navigate to dashboard.
          - Enter Mnemonics, Password and Confirmation password.
          - Click on Connect.
          - Navigate to Your Profile page.
          - Verify Manual and Connect links
      Result: User should be navigated to the Manuak and Connect pages.
    """
    twin_page = before_test_setup(browser)
    assert twin_page.connect_manual_link() == 'https://www.manual.grid.tf/documentation/threefold_token/storing_tft/tf_connect_app.html'
    assert twin_page.get_connect_google_link() == 'https://play.google.com/store/apps/details?id=org.jimber.threebotlogin&hl=en&gl=US'
    assert twin_page.get_connect_apple_link() == 'https://apps.apple.com/us/app/threefold-connect/id1459845885'