package main

func main() {
	err := Run(":7766")
	if err != nil {
		panic(err)
	}
}
