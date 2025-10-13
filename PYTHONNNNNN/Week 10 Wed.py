# #BrendanC
# #Question2

# MyList=[2,5,6,9,10,25,13]
# print(MyList)


# #BrendanC
# #Question 8

# Colour = input("What is your favourite colour? ").lower().strip()
# if Colour == "red":
#     print("Wow, its my favourite colour too!")
# elif Colour == "green":
#     print("Nice colour, but not my favourite.")
# elif Colour == "blue":
#     print("Nice colour, it starts with the letter 'b'")
# elif Colour == "yellow":
#     print("This is a great colour too!")
# else:
#     print("You need to type in a word")

# #BrendanC
# #Question 9

# Name = input("What is your first name? ").title().strip()
# Purchase = input("What fruit did you purchase? ").capitalize()
# Price = float(input(f"What did you pay for the {Purchase}'s? "))
# Amount = int(input(f"How many {Purchase}'s did you purchase at ${Price}? "))
# Total = (Price * Amount)

# print(f"Hi {Name}, You bought {Amount} {Purchase}'s at ${Price} each.  The total you owe me is ${Total}")

#BrendanC
#Question10

Name = input("What is your first name? ")
Age = int(input("What is your age? "))
print(f"Morena {Name}, the data type of your name is "print type(Name)".")
print(f"And the data type of your age is "print type(Age)".")