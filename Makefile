# this makefile was implemented to run a few of commands that will work against the whole repo


release:
	yarn lerna version --force-publish --exact

help:
	@echo "\n- To build a specific project, you can do that by executing 'make build project=<project_name>'."
	@echo "\n- To run a specific project, you can do that by executing 'make run project=<project_name>'."
	@echo "\n- To relese the repo you can do that by executing 'make release'.\n"

run:
ifeq ($(project), playground)
	cd packages/playground && yarn dev
else ifeq ($(project), dashboard)
	cd packages/dashboard && yarn serve
else ifeq ($(project), UI)
	cd packages/UI && yarn dev
endif

build:
ifeq ($(project), dashboard)
	cd packages/dashboard && yarn build
else ifeq ($(project), grid_client)
	cd packages/grid_client && yarn build
else ifeq ($(project), grid_http_server)
	cd packages/grid_http_server && yarn build
else ifeq ($(project), grid_rmb_server)
	cd packages/grid_rmb_server && yarn build
else ifeq ($(project), rmb_direct_client)
	cd packages/rmb_direct_client && yarn build
else ifeq ($(project), rmb_peer_client)
	cd packages/rmb_peer_client && yarn build
else ifeq ($(project), rmb_peer_server)
	cd packages/rmb_peer_server && yarn build
else ifeq ($(project), stats)
	cd packages/stats && yarn build
else ifeq ($(project), tfchain_client)
	cd packages/tfchain_client && yarn build
else ifeq ($(project), weblets)
	cd packages/weblets/playground && yarn build
else ifeq ($(project), playground)
	cd packages/playground && yarn build
else ifeq ($(project), graphql_client)
	cd packages/graphql_client && yarn build
else ifeq ($(project), gridproxy_client)
	cd packages/gridproxy_client && yarn build
else ifeq ($(project), UI)
	cd packages/UI && yarn build
else
	yarn lerna run build --no-private
endif
