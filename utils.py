import random
import re


def new_equation_generator(seed):
    random.seed(int(seed))
    op_list = ['+', '-', '/', '*']
    retry = True

    while True:
        ans_st = ""
        ans_ls = []

        while True:
            a = (random.randint(0,9))
            b = (op_list[random.randint(0,3)])
            ans_ls.append(a)
            ans_st = ans_st + str(a) +b

            if len(ans_st) > 7:
                break

        final_true = (ans_st[0:7])
        

        try:
            eval_result = eval(final_true)
            if eval_result == int(eval_result) and abs(eval_result)<200  and not re.search('(0\*)|(\*0)|(/0)|(0/)', final_true):
                retry = False

            # check if the division is a whole number
            for i in range(0, len(final_true)):
                if final_true[i] == '/':
                    before_div = final_true[i-1]
                    after_div = final_true[i+1]

                    val = float(int(before_div)/int(after_div))
                    round_val = float(round(val))

                    if val != round_val:
                        retry = True
                        break
        except:
            pass

        if retry:
            continue
        else:
            break
    
    return final_true, eval_result