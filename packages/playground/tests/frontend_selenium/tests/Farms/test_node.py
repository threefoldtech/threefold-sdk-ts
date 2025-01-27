from utils.utils import get_email, generate_inavalid_gateway, generate_inavalid_ip, generate_ip, generate_leters, generate_string, get_node_seed, randomize_public_ipv4, valid_amount
from pages.node import NodePage
from utils.grid_proxy import GridProxy
from pages.dashboard import DashboardPage
from datetime import datetime
import random
import math
import time


#  Time required for the run (12 cases) is approximately 3 minutes.

def before_test_setup(browser):
    """
    Sets up the browser with necessary configurations, loads the dashboard, 
    and navigates to the Node page.
    """
    node_page = NodePage(browser)
    grid_proxy = GridProxy(browser)
    dashboard_page = DashboardPage(browser)
    password = generate_string()
    dashboard_page.open_and_load()
    dashboard_page.import_account(get_node_seed())
    dashboard_page.click_button(dashboard_page.connect_your_wallet(get_email(), password))
    node_page.navigate()
    return node_page, grid_proxy


def test_node_page(browser):
    """
      Test Case: TC1216 - Navigate to farm node
      Steps:
          - Navigate to the dashboard.
          - Login into an account (with node).
          - Click on Farm from side menu.
      Result: User should be navigated to Farm Nodes page and see all his node.
    """
    node_page, grid_proxy = before_test_setup(browser)
    nodes = grid_proxy.get_twin_node(str(node_page.twin_id))
    for node in nodes:
        assert str(node['nodeId']) in browser.page_source


def test_node_details(browser):
    """
      Test Case: TC1216 - Navigate to farm node
      Steps:
          - Navigate to the dashboard.
          - Login into an account (with node).
          - Click on Farm from side menu.
      Result: User should be navigated to Farm Nodes page and see all his node.
    """
    node_page, grid_proxy = before_test_setup(browser)
    nodes = grid_proxy.get_twin_node(str(node_page.twin_id))
    node_details = node_page.node_details()
    for detail in node_details:
        for node in nodes:
            if detail[6] == node['nodeId']:
                assert node['publicConfig']['ipv4'] == detail[1]
                assert node['publicConfig']['gw4'] == detail[2]
                assert node['publicConfig']['ipv6'] == detail[3]
                assert node['publicConfig']['gw6'] == detail[4]
                assert node['publicConfig']['domain'] == detail[5]
                assert node['nodeId'] == detail[6]
                assert node['farmId'] == detail[7]
                assert node['twinId'] == detail[8]
                assert node['country'] == detail[9]
                assert node['city'] == detail[10]
                assert datetime.fromtimestamp(node['created']).strftime("%m-%d-%y, %I:%M %p") == detail[11]
                assert node['farmingPolicyId'] == detail[12]
                assert datetime.fromtimestamp(node['updatedAt']).strftime("%m-%d-%y, %I:%M %p") == detail[13]
                assert math.isclose((node['used_resources']['cru'] / node['total_resources']['cru']) * 100, detail[14], abs_tol=0.01)
                assert math.isclose((node['used_resources']['sru'] / node['total_resources']['sru']) * 100, detail[15], abs_tol=0.01)
                assert math.isclose((node['used_resources']['hru'] / node['total_resources']['hru']) * 100, detail[16], abs_tol=0.01)
                assert math.isclose((node['used_resources']['mru'] / node['total_resources']['mru']) * 100, detail[17], abs_tol=0.01)
                assert node['status'].lower() == detail[18].lower()
                assert node['certificationType'] == detail[19]
                assert node['serialNumber'] == detail[20]
                assert node['uptime'] == detail[21]


def test_config_validation(browser):
    """
      Test Case: TC1220 - Add a public config validation
      Steps:
          - Navigate to the dashboard.
          - Login into an account (with node).
          - Click on Farm from side menu.
          - Click on 'Add a public config' button.
          - Enter values.
      Result: Alert should be displayed and save button will be disabled.
    """
    node_page, grid_proxy = before_test_setup(browser)
    nodes = grid_proxy.get_twin_node(str(node_page.twin_id))
    node_id = nodes[random.randint(0, len(nodes) - 1)]['nodeId']
    node_page.setup_config(node_id)
    cases = [generate_string(), '1.0.0.0/66', '239.255.255/17', '239.15.35.78.5/25', '239.15.35.78.5', ' ', '*.#.@.!|+-']
    for case in cases:
        node_page.add_config_input(case, 0, 0, 0, 0)
        assert node_page.wait_for('IPv4 is not valid.')
        assert not node_page.get_save_button().is_enabled()

    node_page.add_config_input('255.0.0.1/32', 0, 0, 0, 0)
    assert node_page.wait_for('Private IP addresses are not allowed.')
    assert not node_page.get_save_button().is_enabled()


def test_add_config(browser):
    """
      Test Case: TC1221 - Add a public config
      Steps:
          - Navigate to the dashboard.
          - Login into an account (with node).
          - Click on Farm from side menu.
          - Click on 'Add a public config' button.
          - Enter values and click on save button.
      Result: User should be able to add the public config to his farm node.
    """
    node_page, grid_proxy = before_test_setup(browser)
    nodes = grid_proxy.get_twin_node(str(node_page.twin_id))
    rand_node = random.randint(0, len(nodes) - 1)
    node_id = nodes[rand_node]['nodeId']
    old_ipv4 = nodes[rand_node]['publicConfig']['ipv4']
    new_ipv4 = '125.25.25.25/25'
    node_page.setup_config(node_id)
    node_page.add_config_input(new_ipv4, '125.25.25.24', '2600:1f13:0d15:95:00::/64', '2600:1f13:0d15:95:00::1', 'tf.grid').click()
    node_page.wait_for('Public config saved successfully.')
    counter = 0
    while old_ipv4 != new_ipv4:
        old_ipv4 = grid_proxy.get_node_ipv4(node_id)
        counter += 1
        if counter == 30:
            time.sleep(2)
    assert grid_proxy.get_node_ipv4(node_id) == new_ipv4


def test_remove_config(browser):
    """
      Test Case: TC1222 - Remove a public config
      Steps:
          - Navigate to the dashboard.
          - Login into an account (with node).
          - Click on Farm from side menu.
          - Click on 'Add a public config' button.
          - Click on Remove config button.
      Result: User should be able to remove his node config.
    """
    node_page, grid_proxy = before_test_setup(browser)
    nodes = grid_proxy.get_twin_node(str(node_page.twin_id))
    rand_node = random.randint(0, len(nodes) - 1)
    node_id = nodes[rand_node]['nodeId']
    node_page.setup_config(node_id)
    node_page.remove_config()
    node_page.wait_for('Public config removed successfully.')
    counter = 0
    ipv4 = grid_proxy.get_node_ipv4(node_id)
    while ipv4:
        ipv4 = grid_proxy.get_node_ipv4(node_id)
        counter += 1
        if counter == 30:
            time.sleep(2)
    assert grid_proxy.get_node_ipv4(node_id) == ''


def test_additional_fee(browser):
    """
      Test Case: TC1750 - Additional Fee
      Steps:
          - Navigate to the dashboard.
          - Login into an account (with node).
          - Click on farms from side menu.
          - Click on 'Set Additional Fee' button.
          - Enter Fee and press 'Set' button.
      Result: Additional fee should have been set on dashboard and grid proxy.
    """
    node_page, grid_proxy = before_test_setup(browser)
    nodes = grid_proxy.get_twin_node(str(node_page.twin_id))
    rand_node = random.randint(0, len(nodes) - 1)
    node_id = nodes[rand_node]['nodeId']
    node_page.setup_fee(node_id)
    valid_fee = valid_amount()
    node_page.set_fee(valid_fee).click()
    node_page.wait_for('Additional fee is set successfully.')
