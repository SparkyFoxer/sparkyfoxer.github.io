<<<<<<< HEAD
# 6/10/2025
# Pseudocode practice
# Can I go to the beach today?

# Temp=int(input("What is the current temp?: "))
# Day=input("What day of the week is it? Mon, Tue, Wed, Thu, Fri, Sat, Sun: ").strip().capitalize()
# if Day=="Sat" or Day=="Sun":
#     if Temp >= 20 and Temp <= 30: print("Yes you can go to the beach!")
#     else: print("You can't go to the beach")
# else: print("You can not go to the beach")


# word = input("Please enter a word whose letters are all lower case: ").strip()
# if word.islower():
#     print(f"It is {True} that you have entered a lower case word")
# else:
#     print(f"It is {False}, Try again")

# #Brendan C
# #Question 1


# Number=int(input("Please enter a number: "))
# if Number <= 0:
#     print("This is an invalid number")
# elif (Number % 2):
#     print ("The number is odd.")
# else:
#     print("The number is even.")
# print("Thank you for your input.")

# # Brendan C
# # Question 2

# Number=float(input("Please enter a number: "))
# if (Number <= 0):
#     print("Invalid Number - Try again!")
# elif (Number % 5 == 0):
#     print(f"The number {Number} is divisible by 5.")
# else:
#     print(f"The number {Number} is not a multiple of 5.")

# Brendan C
# Question 3

# Password=str(input("Please enter the password: "))
# Password == "sunbeam"
# if Password != "sunbeam":
#     print("NO ACCESS")
# else:
#     print("ENTRY GRANTED")

# The lines of text you need to use to generate the output are given below for you.
# Use f-strings to generate the output.

# integer = input(f'Please enter an integer: ')
# ans = int(integer) + 1
# print (f'The answer to {integer} + 1 is {ans}')

# #BrendanC
# #question 4

# num = int(input("Please enter an integer: "))
# print(f"Hi, you entered {num} which is of type {type(num)}")

# Is the result of this code True or False?



greeting = len("Hello World")
print (greeting)

# What number will we get as output?




=======
# for i in range(5):
#     print(i)
#  # this prints 0-4

# for number in range (6):
#       print(number)
# #using the word number instead of i makes things easier to understand

# for welcome_to_python in range(10):
#     print("Welcome to Python")
# # # this prints "Welcome to Python" 10 times

# for number in range (21):
#       print(f"The Number Is: {number}")

# Num = int(input("How mant times do you want to print 'Congrats - You have almost finished CITE404!'?: "))
# for i in range(Num):
#     print("Congrats - You have almost finished CITE404!")

# multiplier = int(input("What multiplier should I use? "))
# for number in range (5,11):
#         result = number * multiplier
#         print (f" The number {number} multiplied x {multiplier} is {result}")

# for i in range(1, 10, 2):
#     print(i)
# # this prints odd numbers from 1 to 9

# for i in range(10, 0, -1):
#     print(i)
# # this prints numbers from 10 to 1

# for number in range(5, 101, 5):
#     print(number)
# # this prints multiples of 5 from 5 to 100

# for number in range(5,21, 3):
#     print(number)
# # this prints numbers from 5 to 20 counting by 3s

# step_value = int(input("Enter a step value: "))
# for number in range (0,50, step_value):
#     print (number)

# step_value = int(input("Enter a step value: "))
# for number in range (0,50, step_value):
#     print (number)
          
# start = int(input("Enter start: "))
# stop = int(input("Enter stop: "))
# step = int(input("Enter step: "))
# for number in range(start, stop + 1, step):
#     print (number)

# num = int(input("Enter a number to count down from: "))
# for value in range(num, -1, -1):
#     print(value)

# word = input("Enter a word: ")
# for letter in word:
#     print(len(letter))

FuelUnits=int(input("How many fuel units are needed? "))
for i in range(FuelUnits):
    print(f"Fuel Loaded: [{'#' * (i + 1)}] {i + 1}/{FuelUnits}")
>>>>>>> 685970a493db21d334625d5b143f3d61bf34879a
