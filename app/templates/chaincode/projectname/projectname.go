package main

import (
	"fmt"

	"github.com/hyperledger/fabric/core/chaincode/shim"
	pb "github.com/hyperledger/fabric/protos/peer"
)

type Producer struct {
}

func (c *Producer) Init(stub shim.ChaincodeStubInterface) pb.Response {
	return shim.Success(nil)
}

func (c *Producer) Invoke(stub shim.ChaincodeStubInterface) pb.Response {

	function, args := stub.GetFunctionAndParameters()

	switch function {
	case "create":
		return c.create(stub, args)
	case "update":
		return c.update(stub, args)
	case "query":
		return c.query(stub, args)
	default:
		return shim.Error("Functions: create, update, query")
	}
}

// query gives all stored keys in the database
func (c *Producer) query(stub shim.ChaincodeStubInterface, args []string) pb.Response {

	// See stub.GetStateByRange in interfaces.go
	start, end := "", ""

	if len(args) == 2 {
		start, end = args[0], args[1]
	}

	// resultIterator is a StateQueryIteratorInterface
	resultsIterator, err := stub.GetStateByRange(start, end)
	if err != nil {
		return shim.Error(err.Error())
	}
	defer resultsIterator.Close()

	keys := " \n"
	// This interface includes HasNext,Close and Next
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return shim.Error(err.Error())
		}
		keys += queryResponse.Key + " \n"
	}

	fmt.Println(keys)

	return shim.Success([]byte(keys))
}

// create puts an available PC in the Blockchain
func (c *Producer) create(stub shim.ChaincodeStubInterface, args []string) pb.Response {

	// if len(args) != 3 {
	// 	return shim.Error("create arguments usage: Serialnumber, Serie, Others")
	// }

	// // A newly created computer is available
	// pc := PC{args[0], args[1], args[2], "available"}

	// // Use JSON to store in the Blockchain
	// pcAsBytes, err := json.Marshal(pc)

	// if err != nil {
	// 	return shim.Error(err.Error())
	// }

	// // Use serial number as key
	// err = stub.PutState(pc.Snumber, pcAsBytes)

	// if err != nil {
	// 	return shim.Error(err.Error())
	// }
	return shim.Success(nil)
}

// updateStatus handles sell and hand back
func (c *Producer) update(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	// if len(args) != 1 {
	// 	return shim.Error("This function needs the serial number as argument")
	// }

	// // Look for the serial number
	// v, err := stub.GetState(args[0])
	// if err != nil {
	// 	return shim.Error("Serialnumber " + args[0] + " not found ")
	// }

	// // Get Information from Blockchain
	// var pc PC
	// // Decode JSON data
	// json.Unmarshal(v, &pc)

	// // Change the status
	// pc.Status = status
	// // Encode JSON data
	// pcAsBytes, err := json.Marshal(pc)

	// // Store in the Blockchain
	// err = stub.PutState(pc.Snumber, pcAsBytes)
	// if err != nil {
	// 	return shim.Error(err.Error())
	// }
	return shim.Success(nil)
}

func main() {
	err := shim.Start(new(Producer))
	if err != nil {
		fmt.Printf("Error starting chaincode sample: %s", err)
	}
}
