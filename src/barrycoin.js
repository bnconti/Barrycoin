const SHA256 = require("crypto-js/sha256");

class Transaccion{
	// pequeña clase para almacenar transacciones.
    constructor(emisor, receptor, cantidadMonedas){
        this.emisor = emisor;
        this.receptor = receptor;
        this.cantidadMonedas = cantidadMonedas;
    }

	setCantidadMonedas(cantidadMonedas) {
		this.cantidadMonedas = cantidadMonedas;
	}
}

class Bloque {
    constructor(timestamp, transacciones, hashPrevio = '') {
        this.hashPrevio = hashPrevio;
        this.timestamp = timestamp;
        this.transacciones = transacciones;
        this.hash = this.calcularHash();
        this.nonce = 0;
    }

    calcularHash() {
        return SHA256(this.hashPrevio + this.timestamp + JSON.stringify(this.transacciones) + this.nonce).toString();
    }

    minarBloque(dificultad) {
		/*	Mientras no encuentre un hash válido de acuerdo a la dificultad (cant. de ceros buscados), 
		aumento el nounce en 1 (caso contrario calcularía siempre el mismo hash) y vuelvo a intentar.	*/

		var tiempoInicio = Date.now()
        
		while (this.hash.substring(0, dificultad) !== Array(dificultad + 1).join("0")) {
            this.nonce++;
            this.hash = this.calcularHash();
        }

        console.log("Bloque minado exitosamente con hash '" + this.hash + "' (t =", Date.now() - tiempoInicio ,"ms).");
    }
}


class Blockchain{
    constructor() {
        this.chain = [this.crearGenesis()];
		// crea el blockchain, siendo genesis el bloque padre.

        this.dificultad = 3;	
		/* determina la cant. de ceros con la que tiene que iniciar
		el hash. a mayor cantidadMonedas, más difícil será encontrar
		un hash que cumpla con lo requerido. */
        
		this.transaccionesPendientes = [];	
		// lista con las transacciones que todavía no fueron agregadas a la cadena.

        this.recompensaMinado = 1;
		// recompensa asignada (en monedas) cuando un minero calcula un hash válido.
    }

    crearGenesis() {
        return new Bloque(Date.now(), [], "0");
    }

    getUltimoBloque() {
        return this.chain[this.chain.length - 1];
    }

    minarTransaccionesPendientes(direccionMinador){
		// direccionMinador se necesita para enviar la recompensa cuando haya finalizado el minado.

        let bloque = new Bloque(Date.now(), this.transaccionesPendientes, this.getUltimoBloque().hash);
		// crea el bloque con la lista de transacciones, pero todavía NO es agregado.

        bloque.minarBloque(this.dificultad);
		// comienza a buscar un hash válido.
	
        this.chain.push(bloque);
		// y solamente cuando lo encuentra lo agrega al blockchain.

		// luego se agrega en las las transacciones pendientes la recompensa del minador.
        this.transaccionesPendientes = [
            new Transaccion(null, direccionMinador, this.recompensaMinado)
        ];
    }

    crearTransaccion(transaccion){
        this.transaccionesPendientes.push(transaccion);
    }

    getBalance(cliente){
		/* obtiene la cantidad de monedas correspondientes a un cliente */

        let balance = 0;

        for(const block of this.chain){
            for(const trans of block.transacciones){
                if(trans.emisor === cliente){
                    balance -= trans.cantidadMonedas;
                }

                if(trans.receptor === cliente){
                    balance += trans.cantidadMonedas;
                }
            }
        }

        return balance;
    }

    comprobarBlockchain() {
		/* Recalcula el hash de todos los bloques y los compara con su actual
		para verificar que el blockchain no haya sido manipulado */

        for (let i = 1; i < this.chain.length; i++){
            const bloqueActual = this.chain[i];
            const bloquePrevio = this.chain[i - 1];

            if (bloqueActual.hash !== bloqueActual.calcularHash()) {
                return false;
            }

            if (bloqueActual.hashPrevio !== bloquePrevio.hash) {
                return false;
            }
        }

        return true;
    }
}

let BarryCoin = new Blockchain();
BarryCoin.crearTransaccion(new Transaccion('Barry', 'Frank', 100));

console.log('########################################');
console.log('Barry le envía 100 monedas a Frank. Bruno mina la transacción.');
BarryCoin.minarTransaccionesPendientes('Bruno');
console.log('El sistema transfiere 1 moneda a Bruno por el trabajo de minado, pero eso queda en las transacciones pendientes.');

console.log('\nEl balance de Frank es', BarryCoin.getBalance('Frank'));
console.log('El balance del pizzero es', BarryCoin.getBalance('pizzero'));
console.log('El balance de Bruno es', BarryCoin.getBalance('Bruno'));

console.log('\n########################################');
BarryCoin.crearTransaccion(new Transaccion('Frank', 'pizzero', 50));
console.log('Frank le paga 50 monedas al pizzero. Bruno vuelve a minar la transacción.')
BarryCoin.minarTransaccionesPendientes('Bruno');
console.log('Bruno minó tanto la transferencia de Frank al pizzero como su recompensa anterior. El sistema le vuelve a pagar 1 moneda.');

console.log('\nEl balance de Frank es', BarryCoin.getBalance('Frank'));
console.log('El balance del pizzero es', BarryCoin.getBalance('pizzero'));
console.log('El balance de Bruno es', BarryCoin.getBalance('Bruno'));

console.log('\n########################################');
console.log('Ahora Frank mina la recompensa anterior hacia Bruno. A su vez, el sistema le paga 1 moneda.');
BarryCoin.minarTransaccionesPendientes('Frank');

console.log('\nEl balance de Frank es', BarryCoin.getBalance('Frank'));
console.log('El balance del pizzero es', BarryCoin.getBalance('pizzero'));
console.log('El balance de Bruno es', BarryCoin.getBalance('Bruno'));

console.log('\n########################################');
console.log('Ahora veamos qué ocurre cuando se modifica alguno de los datos ya almacenados.');

console.log('\nEl blockchain es válido? ' + BarryCoin.comprobarBlockchain());
console.log(BarryCoin.chain[2]);

console.log('\nEl pizzero hackea a Frank para que en vez de 50 monedas le pague 50000.');
BarryCoin.chain[2].transacciones[1].cantidadMonedas = 50000;

console.log(BarryCoin.chain[2]);

console.log('\nEl blockchain es válido? ' + BarryCoin.comprobarBlockchain());