import requests
from utils.base import Base

"""
This module contains Grid Proxy getters.
"""

class GridProxy:

    def __init__(self, browser):
        self.browser = browser

    def get_rentable_node(self):
        r = requests.post(Base.gridproxy_url + 'nodes?rentable=true&status=up')
        node_list = r.json()
        r = requests.post(Base.gridproxy_url + 'nodes?rented=true&status=up')
        node_list.extend(r.json())
        return node_list

    def get_farm_details(self, farm_name):
        r = requests.post(Base.gridproxy_url + 'farms?name=' + farm_name)
        details = r.json()
        return details
    
    def get_dedicate_status(self, node_id):
        r = requests.post(Base.gridproxy_url + 'nodes/'+ str(node_id))
        dedicate_status = r.json()
        return (dedicate_status['rentedByTwinId'])
    
    def get_node_ipv4(self, node_id):
        r = requests.post(Base.gridproxy_url + 'nodes/'+ str(node_id))
        farm_node = r.json()
        return (farm_node['publicConfig']['ipv4'])

    def get_node_fee(self, node_id):
        r = requests.post(Base.gridproxy_url + 'nodes/'+ str(node_id))
        farm_node = r.json()
        return (farm_node['extraFee'])/1000
    
    def get_twin_address(self, twin_id):
        r = requests.post(Base.gridproxy_url + 'twins?twin_id='+ twin_id)
        details = r.json()
        return details[0]['accountId']
    
    def get_twin_relay(self, twin_id):
        r = requests.post(Base.gridproxy_url + 'twins?twin_id='+ twin_id)
        details = r.json()
        return details[0]['relay']

    def get_farm_ips(self, farm_id):
        r = requests.post(Base.gridproxy_url + 'farms?farm_id='+ farm_id)
        farm_list = r.json()
        return len(farm_list[0]['publicIps'])

    def get_twin_node(self, twin_id):
        r = requests.post(Base.gridproxy_url + 'farms?twin_id=' + twin_id)
        details = r.json()
        farms = ''
        for detail in details:
            farms += str(detail['farmId']) + ','
        r = requests.post(Base.gridproxy_url + 'nodes?farm_ids=' + farms[:-1])
        details = r.json()
        return details

    def get_stats_capicity(self):
        if Base.net == 'main':
            stats_url = 'https://stats.grid.tf/api/stats-summary'
        else:
            stats_url = 'https://stats.' + Base.net + '.grid.tf/api/stats-summary'
        r = requests.post(stats_url, timeout=10)
        stats_json = r.json()
        return list(stats_json.values())[1::] #Avoid selecting HDD capacity; as its not shown in the dashboard anymore.

    def get_stats(self):
        up = requests.get(Base.gridproxy_url + 'stats?status=up', timeout=10).json()
        standby = requests.get(Base.gridproxy_url + 'stats?status=standby', timeout=10).json()
        # Initialize a dictionary to store the merged data
        merged_data = {}
        # Merge simple values, summing if they differ
        keys_to_sum = ['nodes', 'accessNodes', 'totalCru', 'totalSru', 'totalMru', 'totalHru', 'gpus', 'dedicatedNodes', 'workloads_number']
        for key in keys_to_sum:
            merged_data[key] = up[key] + standby[key]
        # Merge the "farms", "publicIps", "gateways", "twins", and "contracts" fields (they are the same)
        keys_to_add_once = ['farms', 'publicIps', 'gateways', 'twins', 'contracts']
        for key in keys_to_add_once:
            merged_data[key] = up[key]
        # Merge nodesDistribution and calculate unique and common countries
        up_distribution = up['nodesDistribution']
        standby_distribution = standby['nodesDistribution']
        merged_distribution = {}
        common_countries = 0
        for country, up_count in up_distribution.items():
            standby_count = standby_distribution.get(country, 0)
            merged_distribution[country] = up_count + standby_count
            if standby_count > 0:
                common_countries += 1
        for country, standby_count in standby_distribution.items():
            if country not in merged_distribution:
                merged_distribution[country] = standby_count
        merged_data['nodesDistribution'] = merged_distribution
        # Calculate the total countries: all unique countries minus common countries
        total_countries = len(merged_distribution)  # Total unique countries
        merged_data['countries'] = total_countries
        # Return the dictionary directly
        return merged_data
