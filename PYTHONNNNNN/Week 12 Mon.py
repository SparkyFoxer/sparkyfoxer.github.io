# counter = 1
# while counter <10:
#     print("Hello")
#     counter += 1

# counter = 30
# while counter < 41 and counter > 29:
#     print(counter)
#     counter += 1

# counter = 45
# while counter < 46 and counter > 0:
#     print(counter)
#     counter -= 1

# ## Actual answer
# # Print numbers from 30 to 40 inclusive
# counter = 30
# while counter <= 40:
#     print(counter)
#     counter += 1

# # Print numbers backward from 45 to 1
# counter = 45
# while counter >= 1:
#     print(counter)
#     counter -= 1

# ##ANSWER
# end_number = int(input("What number shall we count up to? "))
# counter = 1
# while counter <= end_number:
#     print(counter)
#     counter += 1

# counter = int(iinput("What number shall we count down from? "))
# while counter >= 1:
#     print(counter)
#     counter -= 1

# #ask the user for a number. Using a while loop print out the miltiplicatin table up to 10
# #hind: start off by using the number 5 as the variable, make sure yo can get output if the 5 times table
# Num = input("Enter a number to see its multiplication table: ")
# Num = int(Num)
# counter = 1
# while counter <= 10:
#     print(f"{Num} x {counter} = {Num * counter}")
#     counter += 1

# counter = 1
# total = 0
# while counter <= 10:
#     total = counter *5
#     print (f"{counter} * 5 = {total}")
#     counter += 1

# number = int(input("What times table would you like? "))
# counter = 1
# while counter <= 10:
#     print(f"{counter} X {number} is {counter * number}")
#     counter += 1

# Number = int(input("Please enter a number "))
# while Number > 2 and Number < 299:
#     print(Number)
#     Number -= 1
#wrong

# ##Answer
# #Calculate the sun of numbers between 2 and 25 exclusive
# counter = 2
# total = 0
# while counter < 25:
#     total = total + counter #another way instead of total += counter
#     # print (total) add this line to get a running total to display
#     counter += 1
# print (f"The grand total of all the numbers is {total}")