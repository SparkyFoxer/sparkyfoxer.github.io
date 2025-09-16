# 17/09/2025
# Basic loops (Using if() witth lists[])

# fruits = ["apple", "banana","cherry"]
# for Eachfruit in fruits:
#     print(Eachfruit)

# for "amount" in fruits, print how many times the "amount" of the item is in the list
# is _apple_ in fruits = yes = "print apple"

# Animals = ["Cat","Dog","Bird","Fox","Mouse"] # my list
# print (Animals) # print the list
# print (type(Animals)) # prints the type of class the list is
# for Animal in Animals: 
#     print(Animal) # for each animal, print the animal then check for another till none left
# print (f"Your chosen animal is {Animals}") #after all animals have been named it will break out and run this
# print("These are my fav animals!")

# Words = ["wow","nice","great","awesome","amazing"]
# Name = input("What is the child's name? ")
# print(f"Hi {Name}, you're {Words[3]}")
# # Prints the 3rd item in the list

# Colour = ["Red","Green","Blue","Yellow","Purple"]
# print(Colour)
# print (type(Colour))
# for Colours in Colour:
#     print(Colours)
# print(f"Colour: {Colour}")

# Num = [1,2,3,4,5]
# for Numbers in Num: # will double each number in the list
#     print(Numbers*2)

# FriendNames = ["Oli, Ali, Noah, Tobias"]
# for Friends in FriendNames:
#     print(Friends)
# print(f"Hello {Friends}, Hope you're doing well!")

# Food=[]
# FavFood=input("What is your favourite food? ")
# Food.append(FavFood)
# print(Food)
# NextFavFood=input("What is your next favourite food? ")
# Food.append(NextFavFood)
# print(Food)
# AnotherFood=input("What is yet another fav food? ")
# Food.append(AnotherFood)
# print(Food)
# print(f"Your list of favourite foods are {FavFood}, {NextFavFood}, {AnotherFood}!")

# #BrendanC
# #Question4

# grocery_list = ["milk", "bread", "eggs", "butter", "apples", "cheese"]
# grocery_list[3] = "cereal"
# print(grocery_list)

#BrendanC
#Question5

# grocery_list = ["milk", "bread", "eggs", "butter", "apples", "cheese"]
# grocery_list.append("chips")
# grocery_list.append("pies")
# print(grocery_list)

# #BrendanC
# #Question8

# grocery_list = ["milk", "bread", "eggs", "butter", "apples", "cheese", "chips", "vegemite", "peanut butter", "chicken"]
# List=len(grocery_list)
# print(List)

#BrendanC
#Question5

#Enter the temperature in °C:
#Is it raining? (yes/no) 

# If it’s 30 or above and not raining, print "Wear shorts and a t-shirt".
# If it’s 20–29 and not raining, print "Wear light clothes".
# If it’s 20–29 and raining, print "Wear light clothes and take an umbrella".
# If it’s 10–19 and not raining, print "Wear a sweater".
# If it’s 10–19 and raining, print "Wear a sweater and raincoat".
# If it’s below 10  print "Extreme weather – stay indoors!".  


# #BrendanC
# #Question5
# Temp=int(input("Enter the temperature in °C: "))
# Raining=input("Is it raining? (yes/no) ").strip().lower()
# if Raining == "yes":
#     if Temp >= 20 and Temp <= 30: print("Wear light clothes and take an umbrella")
#     elif Temp >= 10 and Temp <= 19: print("Wear a sweater and raincoat")
#     elif Temp <10: print("Extreme weather – stay indoors!")
# else:
#     if Temp >= 30: print("Wear shorts and a t-shirt")
#     elif Temp >=20 and Temp <=29: print("Wear light clothes")
#     elif Temp >=10 and Temp <=19: print("Wear a sweater")
#     elif Temp <10: print("Extreme weather - stay indoors!")

#BrendanC
#Question6

#What is your word, number or phrase? 
Word=input("What is your word, number or phrase? ")
CheckedWord=Word.isupper()
print(CheckedWord) # is checking to see if the word inputed is all caps or not

Word=(input("Please input something: ")).strip()
CheckedWord=Word.isalpha()
if Word.isalpha("a")
    if CheckedWord.startswith("a"):
        print("Starts with a")
    elif CheckedWord.startswith("a"):
        print("Doesnt start with a")
else:
    print("You put a mix of characters")
#You entered only numbers
#You entered only letters
#You entered letters and numbers
#You entered only spaces!
#Your word is a mix of other characters, including punctuation.

