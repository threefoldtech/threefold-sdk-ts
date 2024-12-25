import math
import pytest
from utils.utils import byte_converter,convert_to_scaled_float
from pages.statistics import StatisticsPage
from utils.grid_proxy import GridProxy
from pages.dashboard import DashboardPage

def before_test_setup(browser):
    statistics_page = StatisticsPage(browser)
    dashboard_page = DashboardPage(browser)
    dashboard_page.open_and_load()
    statistics_page.navigate()
    return statistics_page

@pytest.mark.skip(reason="https://github.com/threefoldtech/tfgrid-sdk-ts/issues/3751")
def test_statistics_details(browser):
    """
      TC1503 - Verify Statistics
      Steps:
          - Navigate to the dashboard.
          - Click on TFGrid from side menu.
          - Click on Stats.
      Result: Assert that the displayed values should match the data from the grid proxy.
    """
    statistics_page = before_test_setup(browser)
    grid_proxy = GridProxy(browser)
    statistics_details = statistics_page.statistics_detials()
    grid_statistics_details = grid_proxy.get_stats()
    # Convert necessary values from string to integer for comparison, but keeping the dictionary structure
    statistics_details_converted = {
        key: int(value.replace(',', '')) if value is not None and value.replace(',', '').isdigit() else value
        for key, value in statistics_details.items()
    }
    # Full set of assertions, comparing UI stats with proxy stats
    assert grid_statistics_details['nodes'] == statistics_details_converted['nodes']
    assert grid_statistics_details['dedicatedNodes'] == statistics_details_converted['dedicatedNodes']
    assert grid_statistics_details['farms'] == statistics_details_converted['farms']
    assert grid_statistics_details['countries'] == statistics_details_converted['countries']
    assert grid_statistics_details['totalCru'] == statistics_details_converted['totalCru']
    assert math.isclose(convert_to_scaled_float(grid_statistics_details['totalSru']), convert_to_scaled_float(byte_converter(statistics_details_converted['totalSru'])), abs_tol=0.002)
    assert math.isclose(convert_to_scaled_float(grid_statistics_details['totalHru']), convert_to_scaled_float(byte_converter(statistics_details_converted['totalHru'])), abs_tol=0.002)
    assert math.isclose(convert_to_scaled_float(grid_statistics_details['totalMru']), convert_to_scaled_float(byte_converter(statistics_details_converted['totalMru'])), abs_tol=0.002)
    assert grid_statistics_details['gpus'] == statistics_details_converted['gpus']
    assert grid_statistics_details['accessNodes'] == statistics_details_converted['accessNodes']
    assert grid_statistics_details['gateways'] == statistics_details_converted['gateways']
    assert grid_statistics_details['twins'] == statistics_details_converted['twins']
    assert grid_statistics_details['publicIps'] == statistics_details_converted['publicIps']
    assert grid_statistics_details['contracts'] == statistics_details_converted['contracts']
    assert grid_statistics_details['workloads_number'] == statistics_details_converted['workloads_number']


def test_tfgrid_links(browser):
    """
      TC2867 - Verify TFGrid links
      Steps:
          - Navigate to the dashboard.
          - Click on TFGrid from side menu.
          - Click on Grid Status.
          - Click on Node Monitoring.
      Result: Assert that The links match the pages.
    """
    statistics_page = before_test_setup(browser)
    assert statistics_page.grid_status_link() == 'https://status.grid.tf/status/threefold/'
    assert statistics_page.node_monitoring_link() == 'https://metrics.grid.tf/d/rYdddlPWkfqwf/zos-host-metrics?orgId=2&refresh=30s/'