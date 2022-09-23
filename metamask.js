let boutton_de_connexion = document.querySelector('.btn_connexion');
let boutton_de_paiement = document.querySelector('.btn_paiement');
let affichage_prix_crypto = document.querySelector('.prix_crypto');

let info_crypto = {
    "eth" : {
        'name' : 'ethereum',
        'id_network' : 1,
        'url' : 'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=eur',
        'symbol' : 'ETH'
    },
    "avax" : {
        'name' : 'avalanche-2',
        'id_network' : 43114,
        'url' : 'https://api.coingecko.com/api/v3/simple/price?ids=avalanche-2&vs_currencies=eur',
        'symbol' : 'AVAX'
    },
    "eth_goerli" : {
        'name' : 'ethereum',
        'id_network' : 5,
        'url' : 'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=eur',
        'symbol' : 'ETH-Gerli'
    }
}; // Tableau des differentes crypto
let prix_crypto; // recuperation du prix de la crypto dynamiquement

let account; // Stockage du compte utilisateur
let amount; // Montant total à payer en fonction de la crypto
let prix_du_produit = 100; // Prix à payer pour l'utilisateur

if (!window.ethereum){ // Si l'utilisateur n'a pas Metamask
    boutton_de_connexion.addEventListener('click', () => {
        window.open('https://metamask.io/download/', '_blank');
    })
} // Verification de la presence de Metamask

boutton_de_connexion.addEventListener('click', recupDonneCompte); // Connexion

function recupDonneCompte (){
    ethereum.request({method: 'eth_requestAccounts'}).then(accounts => {
        account = accounts[0];
        console.log(account);
        boutton_de_connexion.textContent = account.slice(0,10)+"...."+account.slice(account.length-10,account.length); // affichage du compte
        boutton_de_connexion.style.fontSize = "small";

        ethereum.request({method: 'eth_getBalance' , params: [account, 'latest']}).then(result => {
            console.log('balance: '+ result); // recuperation de la balance du compte
            let wei = parseInt(result,16);
            console.log('wei: ' + wei);
            let balance = wei / (10**18);
            console.log(balance + ' ETH');
        });
    });
    verification(window.ethereum.networkVersion); // Verification du network dans lequelle nous nous trouvons
} // Récuperation du compte Metamask actuel

function verification(idNetwork){
    for (let crypto in info_crypto) {
        if (info_crypto[crypto]['id_network'] == idNetwork) {
            let nom_crypto = info_crypto[crypto]['name'];
            let url_crypto = info_crypto[crypto]['url'];
            let symbol_crypto = info_crypto[crypto]['symbol'];
            definitionPrix(nom_crypto, url_crypto, symbol_crypto);
            return;
        }
    }
    console.log('no data fund');
} // Verification du network actuel

function definitionPrix(nom, url, symbol) { // argument correspondant à la crypto principal de la chain detecter lors de Verification()à
    let requete = new XMLHttpRequest();
    requete.open('GET', url);
    requete.responseType = 'json';
    requete.send();
    requete.onload = function () {
        if (requete.readyState === XMLHttpRequest.DONE) {
            if (requete.status === 200) {
                prix_crypto = requete.response[nom]['eur'];
                prix_crypto = parseFloat(prix_crypto).toFixed(2);
                affichage_prix_crypto.textContent = '1 ' + symbol + ' = ' + prix_crypto + ' €';
                boutton_de_paiement.textContent = "Payez " + prix_du_produit + " € en " + symbol;
            }else {
                console.log('status failed');
            }
        }else {
            console.log('Request failed');
        }
    }
} // Fixation des prix

window.ethereum.on('chainChanged', function(networkId){
    verification(networkId);
}); //si l'utilisateur change de reseaux (AVAX, ETH...)

window.ethereum.on('accountsChanged', function (accounts) {
    recupDonneCompte();
}) // Si l'utilisateur change de compte

boutton_de_paiement.addEventListener('click', () =>{
    amount = '0x'+(prix_du_produit/prix_crypto*10**18).toString(16);
    let transactionParam = {
        to: '0x40769010B1d8dA360c3EFd46e6e345a86Bc5158B', //Wallet du receveur de fond
        from: account,
        value: amount
    };

    ethereum.request({method: 'eth_sendTransaction', params:[transactionParam]}).then(txhash => {
        console.log(txhash);
        checkTransactionconfirmation(txhash).then(r => alert(r));
    });

}); // Paiement

function checkTransactionconfirmation(txhash) {
    let checkTransactionLoop = () => {
        return ethereum.request({method:'eth_getTransactionReceipt',params:[txhash]}).then(r => {
            if(r !=null) return 'confirmed';
            else return checkTransactionLoop();
        });
    };
    return checkTransactionLoop();
} // Confirmation de la transaction