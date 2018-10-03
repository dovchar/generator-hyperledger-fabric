'use strict';

const Generator = require('yeoman-generator');
const yosay = require('yosay');
const chalk = require('chalk');

module.exports = class extends Generator {
    constructor(args, opts) {
        super(args, opts);
        this.log('Initializing...');
    }

    start() {
        this.log('Do something...');
    }

    async prompting() {
        this.log(yosay('Welcome to ' + 
            chalk.yellow('Hyperledger Fabric generator') + ' !!'));

        const answers = await this.prompt([{
            type    : 'input',
            name    : 'networkname',
            message : 'Your networkname name',
            default : this.appname // Default to current folder name
            }, {
            type    : 'input',
            name    : 'org',
            message : 'How many orgs you would like to setup',
            default : 2 
        }, {
            type    : 'input',
            name    : 'domains',
            message : 'fine orgs domains by comma separated (myorg.com, myorg2.com): ',
            default : 'example1.com, exmaple2.com'
        }, {
            type    : 'input',
            name    : 'peer',
            message : 'How many peers per org',
            default : 2 
        }, {
            type    : 'confirm',
            name    : 'ca',
            message : 'would you like to define CA server?',
            default : false
          }, {
            type    : 'confirm',
            name    : 'couchdb',
            message : 'would you like to setup couchDB server?',
            default : false
          }, {
            type    : 'confirm',
            name    : 'solo',
            message : 'Orderer type: solo?',
            default : true
          }]);

        console.log(answers.couchdb);

        const domains = answers.domains.split(',');
        const configs = this.preparePeers(answers.org, answers.peer, answers.ca, answers.networkname, domains)  

        console.log(configs)  

        this.fs.copyTpl(
            this.templatePath('docker-compose.yaml'),
            this.destinationPath(answers.networkname + '/docker-compose-'+answers.networkname+'.yaml'),
            { 
                networkname: answers.networkname,
                org: answers.org,
                domain: answers.domain,
                peer: answers.peer,
                ca: answers.ca,
                couchdb: answers.couchdb,
                solo: answers.solo,
                configs: configs
             }
          );
        
        this.fs.copyTpl(
            this.templatePath('configtx.yaml'),
            this.destinationPath(answers.networkname + '/configtx.yaml'),
            { 
                networkname: answers.networkname,
                org: answers.org,
                domain: answers.domain,
                peer: answers.peer,
                ca: answers.ca,
                couchdb: answers.couchdb,
                solo: answers.solo,
                configs: configs
             }
          );
        
        this.fs.copyTpl(
            this.templatePath('cli.yaml'),
            this.destinationPath(answers.networkname + '/cli.yaml'),
            { networkname: answers.networkname }
          );

        this.fs.copyTpl(
            this.templatePath('crypto-config.yaml'),
            this.destinationPath(answers.networkname + '/crypto-config.yaml'),
            { 
                networkname: answers.networkname,
                org: answers.org,
                domain: answers.domain,
                peer: answers.peer,
                ca: answers.ca,
                couchdb: answers.couchdb,
                solo: answers.solo,
                configs: configs
             }
          );
        
        this.fs.copyTpl(
            this.templatePath('peer.yaml'),
            this.destinationPath(answers.networkname + '/peer.yaml'),
            { networkname: answers.networkname }
          );  
    
        this.fs.copyTpl(
            this.templatePath('network.sh'),
            this.destinationPath(answers.networkname + '/network.sh')
          );

        this.fs.copyTpl(
            this.templatePath('gitkeep'),
            this.destinationPath(answers.networkname + '/chaincode/.gitkeep')
          );

        this.fs.copyTpl(
            this.templatePath('gitkeep'),
            this.destinationPath(answers.networkname + '/channels/.gitkeep')
          );
        
        this.fs.copyTpl(
            this.templatePath('gitkeep'),
            this.destinationPath(answers.networkname + '/crypto-config/.gitkeep')
        );
        
        this.fs.copyTpl(
            this.templatePath('gitkeep'),
            this.destinationPath(answers.networkname + '/orderer/.gitkeep')
        );

        this.fs.copyTpl(
            this.templatePath('gitkeep'),
            this.destinationPath(answers.networkname + '/client/.gitkeep')
        );  

        this.fs.copyTpl(
            this.templatePath('/chaincode/projectname/projectname.go'),
            this.destinationPath(answers.networkname + '/chaincode/'+ answers.networkname+"/"+answers.networkname+".go")
        );  
          
    }

    preparePeers(orgs, peers, cas, networkname, domains) {
        let configs = [];
        for(let i=0; i<orgs; i++) {   
            if(cas) {  
                let ca = 
                "ca.org"+i+"."+domains[i].trim()+":"+
                "image: hyperledger/fabric-ca"+
                "environment:"+
                    "- FABRIC_CA_HOME=/etc/hyperledger/fabric-ca-server"+
                    "- FABRIC_CA_SERVER_CA_NAME=ca-org"+i+ ""+
                    "- FABRIC_CA_SERVER_CA_CERTFILE=/etc/hyperledger/fabric-ca-server-config/ca.org"+i+"."+domains[i].trim()+"-cert.pem"
                    "- FABRIC_CA_SERVER_CA_KEYFILE=/etc/hyperledger/fabric-ca-server-config/0e729224e8b3f31784c8a93c5b8ef6f4c1c91d9e6e577c45c33163609fe40011_sk"
                    "- FABRIC_CA_SERVER_TLS_ENABLED=true"
                    "- FABRIC_CA_SERVER_TLS_CERTFILE=/etc/hyperledger/fabric-ca-server-config/ca.org"+i+"."+domains[i].trim()+"-cert.pem"
                    "- FABRIC_CA_SERVER_TLS_KEYFILE=/etc/hyperledger/fabric-ca-server-config/0e729224e8b3f31784c8a93c5b8ef6f4c1c91d9e6e577c45c33163609fe40011_sk"
                "ports:"
                    "- \"7054:7054\""
                "command: sh -c 'fabric-ca-server start -b admin:adminpw -d'"
                "volumes:"
                    "- ./channel/crypto-config/peerOrganizations/org"+i+"."+domains[i].trim()+"/ca/:/etc/hyperledger/fabric-ca-server-config"
                "container_name: ca_peerOrg"+i+""
              configs.push(ca);
            }  
            for(let j=0; j<peers; j++) { 
              let peer = 
              "peer"+j+"."+domains[i].trim()+":"+
                "container_name: peer"+j+"."+domains[i].trim()+""+
                "extends:"+
                  "file: ./peer.yaml"+
                  "service: peer"+
                "environment:"+
                  "- CORE_PEER_ID=peer"+j+"."+domains[i].trim()+""+
                  "- CORE_PEER_ADDRESS=peer"+j+"."+domains[i].trim()+":7051"+
                  "- CORE_PEER_LOCALMSPID="+domains[i].trim().split('.')[0]+"MSP"+
                  "- CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/msp/peer/"+
                  "- CORE_PEER_GOSSIP_EXTERNALENDPOINT=peer"+j+"."+domains[i].trim()+":7051"+
                "volumes:"+
                  "- ./crypto-config/peerOrganizations/"+domains[i].trim()+"/peers/peer"+j+"."+domains[i].trim()+"/msp:/etc/hyperledger/msp/peer"+
                "ports:"+
                  "- 7051:7051"+
                  "- 7053:7053"+
                "depends_on:"+
                  "- orderer."+ networkname+".com"+
                "networks:"+
                  "- "+ networkname+""
                configs.push(peer)
            }
        }
        return configs;
    }

    async install() {
        
    }

    // writing() {
    //     this.fs.copyTpl(
    //       this.templatePath('docker-compose.yaml'),
    //       this.destinationPath(this.answers.title + '/docker-compose.yaml'),
    //       { title: 'test msg' } // user answer `title` used
    //     );
    //   }
};