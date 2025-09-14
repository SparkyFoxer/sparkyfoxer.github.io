#Fruits=("Apples, Bananas, Cherry, Plums, Oranges, Pear, Mandarin") # shows list as the items themselves
#print(Fruits)
# NoFruits=len("Apples, Bananas, Cherry, Plums, Oranges, Pear, Mandarin") # This prints the number of characters in the list
# print(NoFruits)
#FruitList=Fruits.split() #This puts things in a list
#print(FruitList)
#NumFruits=len(FruitList) # len is asking for the length of things in the quotes
# print(NumFruits)
# print(f"You have {NumFruits} items in your shopping list") # printing what you're asking for

#print(FruitList[:3]) # prints things [0Apples, 1Bananas, 2Cherry, 3Plums, 4Oranges, 5Pear, 6Mandarin]
#print(FruitList[2:4]) # prints ['Cherry,'Plums']

#FruitList.append("Mango") # Adds Mango to the list
#print(FruitList) # Prints the list with the new item ['Mango']
#print(FruitList[6:8]) # prints ['Mandarin', 'Mango']

#FruitList.insert(2,"Watermelon") # Adds a new thing in the third spot in the list with Watermelon (.insert(Position, "NewItem"))
# print(FruitList) # ['0Apples,', '1Bananas,', '2Watermelon', '3Cherry,', '4Plums,', '5Oranges,', '6Pear,', '7Mandarin', '8Mango']
#FruitList.remove("Pear")
#print(FruitList)

FruitList=["Apples, Bananas, Watermelon, Cherry, Plums, Oranges, Pear, Mandarin, Mango"]
FruitList.pop(1)
print(FruitList)