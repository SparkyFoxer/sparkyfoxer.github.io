# 15/09/2025
# Lists and if

# lists do not need to be in any order eg. ["cat","dog","25","27"]
ShoppingList=["Toothpaste","Tomato sauce","Lettuce","Buns","Chips","Noodles"]
List=len(ShoppingList) # Print out how many items are there in the list. Hint: use len() 
print(ShoppingList[0]) # Print out the first list item. (Toothpaste)
print(ShoppingList[1:4]) # Print out the second, third and fourth item in the list (Tomato sauce, Lettuce and Buns)
print(ShoppingList[-1]) # Print out the last item in the list  Hint: use index [-1] (Noodles)
print(ShoppingList[0:3]) # Print the items from the beginning of our list to “Buns”, but not including Buns. (Toothpaste, Tomato sauce, Lettuce)
print(ShoppingList[2:6]) # Print the items from “Lettuce” to the end of the list. (Lettuce, Buns, Chips, Noodles)

ShoppingList.append("Milk") # Add “Milk” to the end of the list
ShoppingList.insert(0,"Chocolate") # Add Chocolate to the beginning of your list as a new item
ShoppingList.insert(6,"Apples") # Add this item between “Chips” and “Noodles”
ShoppingList.append("Bread")

ShoppingList[3]="Bananas"
ShoppingList[2]="Ice Cream"
ShoppingList.append("Honey")
ShoppingList.append(26.50)
ShoppingList.remove("Chips")
ShoppingList.remove("Toothpaste")
List=len(ShoppingList)
print(ShoppingList)
print(List)
